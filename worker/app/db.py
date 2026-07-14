"""
app/db.py
------------------------------------------------------------------------------
Owns the single PyMongo connection for the worker process. Uses the SAME
"Task" collection/schema shape as the Node backend (Mongoose) - both
services agree on the field names (status, logs, result, etc.) as a shared
contract, even though only the Node side defines a formal schema.
"""
import os
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_task_platform"))
_db = _client.get_default_database()
tasks_collection = _db["tasks"]


def now() -> datetime:
    return datetime.now(timezone.utc)


def get_task(task_id: str):
    return tasks_collection.find_one({"_id": ObjectId(task_id)})


def mark_running(task_id: str) -> None:
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {"status": "RUNNING", "startedAt": now(), "updatedAt": now()},
            "$push": {"logs": {"level": "info", "message": "Worker picked up task", "timestamp": now()}},
        },
    )


def mark_success(task_id: str, result) -> None:
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {"status": "SUCCESS", "result": result, "finishedAt": now(), "updatedAt": now()},
            "$push": {"logs": {"level": "info", "message": "Task completed successfully", "timestamp": now()}},
        },
    )


def mark_failed(task_id: str, error_message: str) -> None:
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {"status": "FAILED", "errorMessage": error_message, "finishedAt": now(), "updatedAt": now()},
            "$push": {"logs": {"level": "error", "message": f"Task failed: {error_message}", "timestamp": now()}},
        },
    )
