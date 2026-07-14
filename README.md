# AI Task Processing Platform — Phase 1

A production-style AI Task Processing Platform: authenticated users create text-processing tasks, run them asynchronously via a Redis queue + Python worker, and monitor status/logs/results via polling.

**Phase 1 scope**: application layer only (MERN + Python worker). No Docker images for the app, no Kubernetes, no Argo CD, no CI/CD — those are Phase 2.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, React Query |
| Backend API | Node.js, Express, TypeScript |
| Background worker | Python |
| Database | MongoDB (Mongoose) |
| Queue | Redis (plain list: LPUSH / BRPOP) |
| Auth | JWT (access token only) + bcrypt |

## Architecture at a glance

```
Next.js  --HTTPS-->  Express API  --LPUSH-->  Redis (task_queue)  --BRPOP-->  Python worker
   ^                      |                                                        |
   |                   MongoDB  <-------------------------------------------------+
   +--- polls GET /tasks/:id every 2s until status is SUCCESS/FAILED ---+
```

See `phase1-design.md` (shared earlier) for the full design doc: DB schema, indexing strategy, Redis failure handling, and API contracts.

## Prerequisites

- Node.js 18+
- Python 3.10+
- Docker (for MongoDB + Redis via `docker-compose.yml` — infra only, not the app)

## 1. Start MongoDB + Redis

```bash
docker compose up -d
```

This starts Mongo on `localhost:27017` and Redis on `localhost:6379`.

## 2. Backend setup

```bash
cd backend
cp .env.example .env      # edit JWT_SECRET to a long random string
npm install
npm run dev                # starts on http://localhost:4000
```

## 3. Python worker setup

```bash
cd worker
cp .env.example .env
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

You should see `Worker started, listening on queue 'task_queue'` in the logs. To simulate horizontal scaling, just run this command again in another terminal — multiple workers can safely consume the same queue (BRPOP is atomic, no double-processing).

## 4. Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # starts on http://localhost:3000
```

## 5. (Optional) Enable password reset emails via Gmail

Forgot/reset password works without this - `forgotPassword` just logs a
warning and returns instead of sending an email. To make it actually send:

1. Turn on 2-Step Verification on your Google account: https://myaccount.google.com/security
2. Create an App Password (choose "Mail"): https://myaccount.google.com/apppasswords
3. In `backend/.env`, set:
   ```
   GMAIL_USER=your.email@gmail.com
   GMAIL_APP_PASSWORD=the16charapppassword
   FRONTEND_URL=http://localhost:3000
   ```
4. Restart the backend. Now "Forgot password?" on the login page sends a real email with a reset link.

## 6. Unified logging - debug everything from one place

The backend and worker both write structured JSON logs to a shared `logs/`
folder at the project root (`logs/backend.log`, `logs/worker.log`), in
addition to their normal terminal output. To watch both merged into a single
live, interleaved stream:

```bash
cd project
node scripts/merge-logs.js
```

This prints every new log line from both services, prefixed `[BACKEND]` /
`[WORKER]`, in the order they actually happen - and also writes everything to
`logs/combined.log`. Leave it running in its own terminal; it's the fastest
way to see exactly where a task gets stuck (e.g. backend logs "Task
enqueued" but worker never logs "Processing task..." = a Redis/Mongo
connection mismatch between the two services).

## 7. Try it out

1. Open `http://localhost:3000` → redirected to `/login` → click "Create one" to register.
2. On the dashboard, click **+ New task**, fill in a title, some input text, and pick an operation.
3. Click **Run** on the task row (or open the task and click **Run task**).
4. Watch the task detail page - it polls every 2 seconds and shows live logs, then the result once the worker finishes.

## API summary

All endpoints are under `/api/v1`. Task endpoints require `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account, returns access token |
| POST | `/auth/login` | Log in, returns access token |
| POST | `/auth/forgot-password` | Request a password reset email |
| POST | `/auth/reset-password` | Set a new password using the emailed token |
| POST | `/tasks` | Create a task (status: PENDING) |
| POST | `/tasks/:id/run` | Enqueue task for execution |
| GET | `/tasks/:id` | Get one task (logs, status, result) |
| GET | `/tasks?status=&page=&limit=` | List current user's tasks |

## Notes / assumptions

- Access-token-only auth (no refresh tokens) per Phase 1 scope decision.
- Redis queue uses a plain list (`LPUSH`/`BRPOP`), not Celery — simplest option that satisfies the async-processing requirement.
- Redis failure handling: since plain lists have no ack/retry mechanism, a background "stale task reaper" (`backend/src/queue/staleTaskReaper.ts`) marks any task stuck in `RUNNING` past a timeout as `FAILED`, so the UI never hangs indefinitely on a crashed worker.
- Docker Compose here is for local **infrastructure** (Mongo/Redis) only — the application itself is deliberately not containerized in Phase 1.
