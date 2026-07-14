/**
 * debug-check.js
 * --------------------------------------------------------------------------
 * One-shot end-to-end pipeline tracer. Run this from the `project` folder
 * with: node debug-check.js
 *
 * It walks the ENTIRE flow a real user would trigger - register, create a
 * task, run it, then poll it - and prints a clear PASS/FAIL for each stage,
 * so you know exactly which layer (backend, Mongo, Redis, worker) is broken
 * without needing to manually inspect 4 terminals.
 *
 * Requires: backend running on :4000 (worker/docker optional to test, but
 * needed for the task to ever reach SUCCESS).
 */

const API = 'http://localhost:4000/api/v1';
const TEST_EMAIL = `debug-${Date.now()}@test.com`;
const TEST_PASSWORD = 'DebugPass123';

function log(step, ok, detail) {
  const tag = ok ? '✅ PASS' : '❌ FAIL';
  console.log(`${tag}  [${step}]  ${detail}`);
}

async function main() {
  console.log('--- AI Task Platform — pipeline trace ---\n');

  // Stage 1: backend reachable at all
  let res;
  try {
    res = await fetch(`${API.replace('/api/v1', '')}/health`);
    const body = await res.json();
    log('Backend reachable', res.ok, `GET /health -> ${res.status} ${JSON.stringify(body)}`);
    if (!res.ok) return finish('Backend is not responding. Is `npm run dev` running in backend/, on port 4000?');
  } catch (err) {
    log('Backend reachable', false, `Could not connect at all: ${err.message}`);
    return finish('Backend is not running or not reachable on http://localhost:4000. Start it with `npm run dev` in backend/.');
  }

  // Stage 2: register a throwaway test user (proves Mongo write + bcrypt path)
  let token, userId;
  try {
    res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Debug User', email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    token = body.data.accessToken;
    userId = body.data.user.id;
    log('Register + Mongo write', true, `Created user ${TEST_EMAIL} (id ${userId})`);
  } catch (err) {
    log('Register + Mongo write', false, err.message);
    return finish('Backend cannot write to MongoDB. Check Docker: `docker ps` should show ai_task_platform_mongo running, and backend/.env MONGO_URI should match.');
  }

  // Stage 3: create a task
  let taskId;
  try {
    res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'debug task', inputText: 'hello world', operationType: 'UPPERCASE' }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    taskId = body.data.task._id;
    log('Create task', true, `Task id ${taskId}, status ${body.data.task.status}`);
  } catch (err) {
    log('Create task', false, err.message);
    return finish('Task creation failed at the API/DB layer - see error above.');
  }

  // Stage 4: run the task (this is what pushes to Redis)
  try {
    res = await fetch(`${API}/tasks/${taskId}/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    log('Enqueue to Redis', true, `Backend accepted run request, status now ${body.data.task.status}`);
  } catch (err) {
    log('Enqueue to Redis', false, err.message);
    return finish('The /run endpoint itself failed - check backend terminal for a stack trace, likely a Redis connection issue (is redis container running? backend/.env REDIS_URL correct?).');
  }

  // Stage 5: poll until terminal state or timeout - this is where a worker/
  // Redis mismatch shows up as "stuck".
  console.log('\nPolling task every 1s for up to 15s (this is where a broken worker connection will hang)...\n');
  const start = Date.now();
  let finalTask = null;
  while (Date.now() - start < 15000) {
    await new Promise((r) => setTimeout(r, 1000));
    res = await fetch(`${API}/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    const task = body.data.task;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  [${elapsed}s] status = ${task.status}`);
    if (task.status === 'SUCCESS' || task.status === 'FAILED') {
      finalTask = task;
      break;
    }
  }

  if (!finalTask) {
    log('Worker picked up task', false, 'Task never left PENDING/RUNNING after 15s.');
    return finish(
      'The task is stuck in the queue - the WORKER never processed it. This means:\n' +
      '  1. Either the worker process is not running at all (check that terminal for "Worker started, listening on queue \'task_queue\'")\n' +
      '  2. Or the worker is connected to a DIFFERENT Redis/Mongo than the backend (compare REDIS_URL and MONGO_URI in backend/.env vs worker/.env - they must match exactly)\n' +
      '  3. Or the worker crashed silently - check the worker terminal for a Python traceback.',
    );
  }

  log('Worker picked up task', true, `Reached terminal state: ${finalTask.status}`);
  if (finalTask.status === 'SUCCESS') {
    log('Full pipeline', true, `Result: "${finalTask.result}" - EVERYTHING IS WORKING END TO END.`);
  } else {
    log('Full pipeline', false, `Task FAILED: ${finalTask.errorMessage}`);
  }

  finish('Trace complete.');
}

function finish(message) {
  console.log(`\n--- ${message} ---`);
}

main().catch((err) => {
  console.error('\nUnexpected error running the diagnostic itself:', err);
});
