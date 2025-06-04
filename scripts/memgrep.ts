import fs from 'fs';
import { memPath, snapshotPath } from './memory-utils';

const args = process.argv.slice(2);
let pattern: string | undefined;
let sinceArg: string | undefined;
let untilArg: string | undefined;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--since') {
    sinceArg = args[++i];
  } else if (a === '--until') {
    untilArg = args[++i];
  } else if (!pattern) {
    pattern = a;
  }
}

if (!pattern) {
  console.error(
    'Usage: ts-node scripts/memgrep.ts <pattern> [--since <iso>] [--until <iso>]'
  );
  process.exit(1);
}

const since = sinceArg ? Date.parse(sinceArg) : NaN;
const until = untilArg ? Date.parse(untilArg) : NaN;
const regex = new RegExp(pattern, 'i');

// Search memory.log
if (fs.existsSync(memPath)) {
  const lines = fs.readFileSync(memPath, 'utf8').split('\n');
  for (const line of lines) {
    if (!regex.test(line)) continue;
    const parts = line.split('|');
    const ts = Date.parse(parts[parts.length - 1].trim());
    if ((!Number.isNaN(since) && ts < since) || (!Number.isNaN(until) && ts > until)) {
      continue;
    }
    const hash = parts[0].trim();
    console.log(`${hash}: ${line.trim()}`);
  }
}

// Search context.snapshot.md
if (fs.existsSync(snapshotPath)) {
  const lines = fs.readFileSync(snapshotPath, 'utf8').split('\n');
  let currentId = 'unknown';
  let currentTs = NaN;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const header = line.match(/^###\s+([^|]+)\s*\|\s*(mem-\d+)/);
    if (header) {
      currentTs = Date.parse(header[1].trim());
      currentId = header[2];
      continue;
    }
    if (!regex.test(line)) continue;
    if (
      (!Number.isNaN(since) && currentTs < since) ||
      (!Number.isNaN(until) && currentTs > until)
    ) {
      continue;
    }
    console.log(`${currentId}: ${line.trim()}`);
  }
}
