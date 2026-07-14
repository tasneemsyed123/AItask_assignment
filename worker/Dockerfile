# worker/Dockerfile
# ------------------------------------------------------------------------
# Multi-stage build: install dependencies into an isolated location in the
# builder stage, then copy just that into a clean runtime image - keeps
# build tooling and pip's cache out of the final image.
#
# Build from the `worker/` directory:  docker build -t ai-task-platform-worker .

# ---- builder: install Python deps to an isolated prefix ----
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
# --user installs to /root/.local, which gets copied wholesale into the
# runtime stage below rather than polluting the system site-packages.
RUN pip install --no-cache-dir --user -r requirements.txt

# ---- runtime: just the installed packages + app source, non-root user ----
FROM python:3.12-slim AS runtime
WORKDIR /app

RUN groupadd --system appuser && useradd --system --gid appuser --no-create-home appuser

COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local
COPY --chown=appuser:appuser app ./app

# app/logger.py resolves its log directory as two parents up from itself
# (app/logger.py -> app/ -> /), matching the monorepo-relative path used in
# local dev (project/logs). In the image that's /logs at the container
# root - pre-create it and hand ownership to the non-root user, since it
# won't have permission to mkdir at the filesystem root itself (this bit
# the backend's logger.ts the same way - see backend/Dockerfile).
RUN mkdir -p /logs && chown appuser:appuser /logs

ENV PATH=/home/appuser/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    HOME=/home/appuser

USER appuser

# No HTTP endpoint to probe (this is a queue consumer, not a server) - rely
# on `docker compose`'s depends_on + restart policy instead of a HEALTHCHECK.
CMD ["python", "-m", "app.main"]
