"""
k8s_probe.py
------------------------------------------------------------------------------
Exec-probe script for Kubernetes liveness/readiness checks on the worker.
The worker has no HTTP server to hit (it's a Redis queue consumer, not a web
service), so the probe instead checks that queue_consumer.py's heartbeat
file (touched every HEARTBEAT_INTERVAL_SECONDS, whether or not a task was
processed) was updated recently. A stale file means the main loop is hung -
stuck processing, deadlocked, or the process died without the container
exiting.

Usage (matches the exec probe command in worker-deployment.yaml):
    python k8s_probe.py

Exit code 0 = healthy, 1 = unhealthy (any reason: missing file, stale file,
unreadable file) - kubelet only cares about the exit code, not stdout.
"""
import os
import sys
import time

HEARTBEAT_FILE = os.getenv("HEARTBEAT_FILE", "/tmp/worker-heartbeat")
# Generous margin over the 10s heartbeat interval (see queue_consumer.py) -
# tolerates one or two slow ticks without flapping the probe.
MAX_STALENESS_SECONDS = 30


def main() -> int:
    try:
        age = time.time() - os.path.getmtime(HEARTBEAT_FILE)
    except OSError:
        return 1  # file missing entirely - worker never started or crashed early
    return 0 if age < MAX_STALENESS_SECONDS else 1


if __name__ == "__main__":
    sys.exit(main())
