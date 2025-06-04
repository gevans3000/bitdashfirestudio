import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { repoRoot, snapshotPath, nextMemId, atomicWrite } from './memory-utils';

function logError(ts: string) {
  const logDir = path.join(repoRoot, 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  atomicWrite(path.join(logDir, `memory-error-${ts}.txt`), `Memory append failed at ${ts}`);
}

function formatTimestamp(): string {
  const iso = new Date().toISOString();
  return iso.slice(0, 16).replace('T', ' ') + ' UTC';
}

function errorTimestamp(): string {
  const iso = new Date().toISOString();
  return iso.slice(0, 19).replace(/[-:]/g, '') + 'Z';
}

try {
  const summary = process.argv[2] || 'No summary provided.';
  const nextGoal = process.argv[3] || 'TBD.';
  const ts = formatTimestamp();
  const sha = execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
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
  atomicWrite(snapshotPath, content + entry);
} catch (err) {
  const ts = errorTimestamp();
  logError(ts);
  throw err;
}
