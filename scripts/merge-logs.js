/**
 * scripts/merge-logs.js
 * --------------------------------------------------------------------------
 * Watches logs/backend.log and logs/worker.log (created automatically by
 * the backend's Winston logger and the worker's Python logger) and merges
 * every new line from both into ONE interleaved stream - printed to the
 * console AND appended to logs/combined.log - so you can debug the whole
 * pipeline from a single place instead of switching between terminals.
 *
 * Usage (from the project root):
 *   node scripts/merge-logs.js
 *
 * Leave it running in its own terminal alongside backend/worker/frontend.
 * Lines are prefixed [BACKEND] / [WORKER] so you can tell at a glance which
 * service produced each line, and they appear in the order they were
 * actually written (real-time arrival order), which for a live system is
 * exactly the order you need to trace a request through the pipeline.
 */
const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
fs.mkdirSync(LOGS_DIR, { recursive: true });

const SOURCES = [
  { file: path.join(LOGS_DIR, 'backend.log'), tag: 'BACKEND' },
  { file: path.join(LOGS_DIR, 'worker.log'), tag: 'WORKER' },
];

const combinedStream = fs.createWriteStream(path.join(LOGS_DIR, 'combined.log'), { flags: 'a' });

function emit(tag, line) {
  if (!line.trim()) return;
  const formatted = `[${tag}] ${line}`;
  console.log(formatted);
  combinedStream.write(formatted + '\n');
}

function watchFile(source) {
  // Ensure the file exists so fs.watchFile doesn't error on a missing path -
  // it will be created by the backend/worker the moment they start logging.
  if (!fs.existsSync(source.file)) {
    fs.writeFileSync(source.file, '');
  }

  let lastSize = fs.statSync(source.file).size;

  fs.watchFile(source.file, { interval: 300 }, (curr, prev) => {
    if (curr.size < prev.size) {
      // File was truncated/rotated (e.g. you deleted it to start fresh) -
      // reset our read position rather than erroring.
      lastSize = 0;
    }
    if (curr.size <= lastSize) return;

    const stream = fs.createReadStream(source.file, { start: lastSize, end: curr.size });
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
    });
    stream.on('end', () => {
      buffer.split('\n').forEach((line) => emit(source.tag, line));
      lastSize = curr.size;
    });
  });
}

console.log('--- Unified log viewer ---');
console.log(`Watching:\n  ${SOURCES.map((s) => s.file).join('\n  ')}`);
console.log(`Combined output also written to: ${path.join(LOGS_DIR, 'combined.log')}`);
console.log('---------------------------\n');

SOURCES.forEach(watchFile);
