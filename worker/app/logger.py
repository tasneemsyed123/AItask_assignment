"""
app/logger.py
------------------------------------------------------------------------------
Structured logging for the worker. Writes to BOTH stdout (for the terminal
you're watching) AND a file at <project-root>/logs/worker.log, mirroring the
backend's logger.ts - so both services' logs land in one shared logs/
folder. See scripts/merge-logs.js at the project root for a tool that
combines backend.log and worker.log into one live interleaved view.
"""
import logging
import os
import json
import sys
from pathlib import Path


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "message": record.getMessage(),
            "service": "ai-task-platform-worker",
            "time": self.formatTime(record),
        }
        if hasattr(record, "extra_fields"):
            payload.update(record.extra_fields)
        return json.dumps(payload)


# Resolves to <project-root>/logs regardless of where python is invoked from -
# this file lives at worker/app/logger.py, so two parents up is worker/, and
# one more up is the project root.
LOGS_DIR = Path(__file__).resolve().parents[2] / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        formatter = JsonFormatter()

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        file_handler = logging.FileHandler(LOGS_DIR / "worker.log", encoding="utf-8")
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))
    return logger
