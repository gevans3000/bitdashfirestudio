import fs from 'fs';
import { execSync } from 'child_process';
import {
  repoRoot,
  readMemoryLines,
  snapshotPath,
  parseMemoryLines,
  validateMemoryEntry,
} from './memory-utils';

const lines = readMemoryLines();
const entries = parseMemoryLines(lines);
const snapshot = fs.existsSync(snapshotPath)
  ? fs.readFileSync(snapshotPath, 'utf8')
  : '';

const errors: string[] = [];
let lastCommitTs = 0;
let lastTaskTs = 0;
const seenCommits = new Set<string>();
const seenTasks = new Set<string>();
const seenMemIds = new Set<string>();
let prevMemNum = 0;

for (const entry of entries) {
  const { hash, timestamp, entryType } = entry;

  for (const err of validateMemoryEntry(entry)) {
    errors.push(err);
  }

  if (entryType === 'commit') {
    if (seenCommits.has(hash)) {
      errors.push(`duplicate commit ${hash}`);
    }
    seenCommits.add(hash);
  } else {
    if (seenTasks.has(hash)) {
      errors.push(`duplicate task ${hash}`);
    }
    seenTasks.add(hash);
  }

  const ts = Date.parse(timestamp);
  if (!Number.isNaN(ts)) {
    if (entryType === 'commit') {
      if (ts < lastCommitTs) {
        const prev = new Date(lastCommitTs).toISOString();
        errors.push(
          `commit timestamp out of order for ${hash}: ${timestamp} < ${prev}`,
        );
      }
      lastCommitTs = Math.max(lastCommitTs, ts);
    } else {
      if (ts < lastTaskTs) {
        const prev = new Date(lastTaskTs).toISOString();
        errors.push(
          `task timestamp out of order for ${hash}: ${timestamp} < ${prev}`,
        );
      }
      lastTaskTs = Math.max(lastTaskTs, ts);
    }
  }

  try {
    execSync(`git cat-file -e ${hash}`, { cwd: repoRoot, stdio: 'ignore' });
  } catch {
    errors.push(`unknown commit ${hash}`);
    continue;
  }

  let commitSummary = '';
  try {
    commitSummary = execSync(`git log -1 --pretty=%s ${hash}`, {
      cwd: repoRoot,
    })
      .toString()
      .trim();
  } catch {
    errors.push(`unable to read summary for ${hash}`);
  }

  const memSummary = entry.summary;
  if (commitSummary && memSummary && memSummary !== commitSummary) {
    errors.push(`summary mismatch for ${hash}`);
  }

  const pattern = new RegExp(`(mem-\\d+)[\\s\\S]*?Commit SHA: ${hash}\\b`);
  const match = snapshot.match(pattern);
  if (!match) {
    errors.push(`snapshot missing mem-id for ${hash}`);
  } else {
    const id = match[1];
    if (seenMemIds.has(id)) {
      errors.push(`duplicate mem-id ${id}`);
    }
    seenMemIds.add(id);
    const num = parseInt(id.replace('mem-', ''), 10);
    if (prevMemNum && num !== prevMemNum + 1) {
      const missing = String(prevMemNum + 1).padStart(3, '0');
      errors.push(`missing mem-id mem-${missing}`);
    }
    prevMemNum = num;
  }
}

if (errors.length) {
  console.error('Memory check failed:');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
} else {
  console.log('Memory check passed');
}
