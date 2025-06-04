const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { repoRoot, snapshotPath, nextMemId } = require('./memory-utils');

function logError(ts) {
  const logDir = path.join(repoRoot, 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(
    path.join(logDir, `memory-error-${ts}.txt`),
    `Memory append failed at ${ts}`
  );
}

function formatTimestamp() {
  const iso = new Date().toISOString();
  return iso.slice(0, 16).replace('T', ' ') + ' UTC';
}

function errorTimestamp() {
  const iso = new Date().toISOString();
  return iso.slice(0, 19).replace(/[-:]/g, '') + 'Z';
}

try {
  const summary = process.argv[2] || 'No summary provided.';
  const nextGoal = process.argv[3] || 'TBD.';
  const ts = formatTimestamp();
  const sha = execSync('git rev-parse --short HEAD', {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const id = nextMemId();
  const entry =
    `### ${ts} | mem-${id}\n` +
    `- Commit SHA: ${sha}\n` +
    `- Summary: ${summary}\n` +
    `- Next Goal: ${nextGoal}\n`;

  let content = '';
  if (fs.existsSync(snapshotPath)) {
    content = fs.readFileSync(snapshotPath, 'utf8');
    if (content.length && !content.endsWith('\n')) content += '\n';
  }
  fs.writeFileSync(snapshotPath, content + entry);
} catch (err) {
  const ts = errorTimestamp();
  logError(ts);
  throw err;
}
