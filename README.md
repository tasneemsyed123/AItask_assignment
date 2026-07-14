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
cp .env.example .env      # generate real passwords, see comment in the file
docker compose up -d
```

This starts Mongo on `127.0.0.1:27017` and Redis on `127.0.0.1:6379` - both require auth (credentials come from the root `.env` above) and only bind to loopback, not your whole LAN. `MONGO_APP_USER`/`MONGO_APP_PASSWORD` in that file must match what you put in `backend/.env` and `worker/.env`'s `MONGO_URI`/`REDIS_URL` below - they're the same credentials, just consumed by different services.

If you already had these containers running from before auth was added, Mongo won't retroactively pick up the new root user on an existing data volume - wipe and recreate:

```bash
docker compose down -v   # -v also removes the mongo_data/redis_data volumes
docker compose up -d
```

## 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Generate a strong `JWT_SECRET` (the server refuses to boot with one shorter than 32 characters, and refuses to boot at all if it's missing) and put it in `backend/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the output into `JWT_SECRET=` in `backend/.env`. Never commit this value - `.env` is gitignored; only `.env.example` (placeholders only) is checked in. If it ever leaks (e.g. pasted into a chat, a screenshot, a support ticket), regenerate it - every existing access token becomes invalid immediately since they're signed with it.

```bash
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

## 7. Automated pipeline trace

`debug-check.js` at the project root is a one-shot diagnostic script - not a
test suite (no Jest, nothing asserts/fails a build) - that walks the entire
flow a real user would trigger (register → create task → run it → poll to
completion) and prints a PASS/FAIL line per stage, so you can see exactly
which layer (backend, Mongo, Redis, worker) is broken without manually
checking four terminals:

```bash
cd project
node debug-check.js
```

Requires the backend running on `:4000`; the worker needs to be running too
for the task to ever reach `SUCCESS` rather than hanging in `PENDING`/
`RUNNING`. Useful any time something in the pipeline seems stuck, and as a
quick smoke test after touching auth, Mongo/Redis config, or the queue.

## 8. Try it out

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

## Security

- **Headers**: `helmet()` configured explicitly - CSP locked to `default-src 'none'` (this is a JSON-only API, nothing should ever load a script/style/frame from it), HSTS at 1 year + `includeSubDomains`, `crossOriginResourcePolicy: cross-origin` (CORS is what actually restricts callers; CORP doesn't need to double up as `same-origin`). `X-Powered-By` is stripped by helmet's `hidePoweredBy`.
- **CORS**: `CORS_ORIGIN` must be the exact frontend origin, never `*` - enforced at boot in production (`config/env.ts` throws if `CORS_ORIGIN=*` and `NODE_ENV=production`).
- **Rate limiting**: Redis-backed (survives restarts, correct across multiple backend instances), with a separate budget per endpoint so hammering one auth route can't exhaust another's:
  - `/api/v1/*` - 300 req / 15 min per IP (baseline)
  - `/auth/register` - 10 / hour per IP
  - `/auth/login` - 20 / 15 min per IP (coarse), **and** 5 / 15 min per IP+email combo (strict)
  - `/auth/forgot-password` - 5 / 15 min per IP
  - `/auth/reset-password` - 10 / 15 min per IP
- **Account lockout**: independent of the rate limiters above and keyed only on email (not IP) - after 5 failed logins on one account within 15 minutes, that account is locked regardless of which IP the attempts come from. Returns the same generic "Invalid email or password" as any other failed login, so a lockout is never distinguishable from a wrong password.
- **Passwords**: bcrypt, cost factor 12, both at registration and password reset. Server-side policy: min 8 chars, upper+lower+digit required, checked against a small common-password blocklist. `bcrypt.compare()` used for all verification (constant-time).
- **JWT**: `JWT_SECRET` required at boot (throws if missing or under 32 chars) - the server will not start with a weak or absent secret. Access-token-only, 15 min expiry (`JWT_EXPIRES_IN`); expired/invalid tokens return a clean 401. No refresh token - deliberate Phase 1 scope decision (see below), not an oversight.
- **Input validation**: every request body and query string goes through a zod schema (`validateBody` / `validateQuery`) before reaching a controller; failures return a consistent `400 { success: false, error: { code: 'VALIDATION_ERROR', message } }` shape, never a stack trace. `z.string()` on every user-supplied field also closes the standard NoSQL-operator-injection vector (`{ "$ne": null }` fails validation outright since it isn't a string).
- **Error handling**: a single error middleware is the only place that builds an HTTP error response; unexpected errors always return a generic 500 with no stack trace or internal detail to the client, in every environment (not just production).
- **Secrets**: `.env` is gitignored in every service (`backend/`, `worker/`, `frontend/`); `.env.example` files with placeholder values are checked in for onboarding. No secrets are hardcoded in source.
- **Logging**: structured (Winston) logs never include request bodies, passwords, tokens, or reset tokens - only IDs, emails, and error messages/stack traces for unexpected (non-`AppError`) failures.
- **MongoDB / Redis**: both now require auth and are bound to `127.0.0.1` only in `docker-compose.yml`, not every interface on the host - previously they had no password and were reachable from the whole LAN (the exact pattern behind most "database left open on the internet" breaches). Mongo uses a dedicated `readWrite`-scoped app user (via `mongo-init/create-app-user.sh`), never the root/admin account, for the connection the backend/worker actually use. A real production deployment should go further than the loopback bind used here for local dev: no published ports at all, reachable only from the backend/worker over a private network/VPC, plus TLS (`?tls=true` / `rediss://`) once traffic crosses any network boundary - both out of scope for this Phase 1 local-dev compose file but required before a real deployment.

## Notes / assumptions

- Access-token-only auth (no refresh tokens) per Phase 1 scope decision.
- Redis queue uses a plain list (`LPUSH`/`BRPOP`), not Celery — simplest option that satisfies the async-processing requirement.
- Redis failure handling: since plain lists have no ack/retry mechanism, a background "stale task reaper" (`backend/src/queue/staleTaskReaper.ts`) marks any task stuck in `RUNNING` past a timeout as `FAILED`, so the UI never hangs indefinitely on a crashed worker.
- Docker Compose here is for local **infrastructure** (Mongo/Redis) only — the application itself is deliberately not containerized in Phase 1.
