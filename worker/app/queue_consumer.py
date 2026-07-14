"""
app/queue_consumer.py
------------------------------------------------------------------------------
CONSUMER side of the task queue. Blocks on BRPOP against the same Redis list
the Node backend LPUSHes into (see backend/src/queue/redisQueue.ts for the
producer side and the shared message contract).

Design notes:
  - BRPOP holds its own dedicated Redis connection open indefinitely (that's
    what "blocking" means) - this connection must NEVER be reused for any
    other command, which is why this module owns its own client instance.
  - The queue message is only a pointer ({"taskId": ...}) - we always re-fetch
    the task from MongoDB rather than trusting the queue payload for
    inputText/operationType, so the source of truth is always the database.
  - Worker-scaling: this loop is safe to run as N parallel replicas. BRPOP on
    a Redis list is atomic - only one consumer will ever receive a given
    queued message, so replicas never double-process the same task.
  - Within a single replica, each dequeued task is handed off to its own
    thread (see run_forever) so one task's processing time never blocks the
    next BRPOP - tasks run concurrently, not queued behind each other.
    PyMongo's client is thread-safe (pooled connections), so concurrent
    db.* calls from multiple task threads are safe.
"""
import json
import os
import random
import threading
import time
import redis
from dotenv import load_dotenv

from . import db
from .chunking import chunk_text
from .operations import OPERATIONS
from .logger import get_logger

load_dotenv()
logger = get_logger("queue_consumer")

QUEUE_KEY = os.getenv("TASK_QUEUE_KEY", "task_queue")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Every task takes ~this long and reports progress in fixed increments over
# that time, regardless of input length - purely so progress bars fill
# visibly and several tasks can be watched running at once, since the real
# string operations below are computed instantly. This paces the progress
# *updates*, not the actual work.
TASK_DURATION_SECONDS = 15
PROGRESS_TICKS = 20

# A dequeued task visibly sits at "Queued" (PENDING) for this long before a
# worker starts it - purely so the Queued -> Processing transition is
# observable in the UI instead of flipping instantly. Randomized per-task so
# several tasks queued together don't all flip to Processing in lockstep.
QUEUE_DELAY_RANGE_SECONDS = (5, 10)


def process_task(task_id: str) -> None:
    task = db.get_task(task_id)
    if task is None:
        logger.error(f"Task {task_id} not found in database - skipping")
        return

    time.sleep(random.uniform(*QUEUE_DELAY_RANGE_SECONDS))

    db.mark_running(task_id)
    logger.info(f"Processing task {task_id} ({task['operationType']})")

    operation = OPERATIONS.get(task["operationType"])
    if operation is None:
        db.mark_failed(task_id, f"Unknown operation type: {task['operationType']}")
        return

    try:
        chunks = chunk_text(task["inputText"])
        parts = [operation.run(chunk) for chunk in chunks]
        result = operation.combine(parts)

        tick_delay = TASK_DURATION_SECONDS / PROGRESS_TICKS
        for tick in range(1, PROGRESS_TICKS + 1):
            db.update_progress(task_id, round(tick / PROGRESS_TICKS * 100))
            time.sleep(tick_delay)

        db.mark_success(task_id, result)
        logger.info(f"Task {task_id} completed successfully")
    except Exception as exc:  # noqa: BLE001 - worker must never crash on a bad task
        db.mark_failed(task_id, str(exc))
        logger.error(f"Task {task_id} failed: {exc}")


def run_forever() -> None:
    client = redis.from_url(REDIS_URL, decode_responses=True)
    logger.info(f"Worker started, listening on queue '{QUEUE_KEY}'")

    while True:
        # BRPOP blocks until a message is available - 0 means "wait forever".
        _, raw_payload = client.brpop(QUEUE_KEY)
        try:
            payload = json.loads(raw_payload)
            # Hand off to a thread and immediately loop back to BRPOP, so
            # this task's processing time doesn't delay picking up the next
            # one - tasks run concurrently instead of queued behind each other.
            threading.Thread(target=process_task, args=(payload["taskId"],), daemon=True).start()
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Failed to process queue message: {exc}")


if __name__ == "__main__":
    run_forever()
