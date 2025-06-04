import fs from 'fs';
import { execSync } from 'child_process';
import { repoRoot, readMemoryLines, snapshotPath } from './memory-utils';

const lines = readMemoryLines();
const snapshot = fs.existsSync(snapshotPath)
  ? fs.readFileSync(snapshotPath, 'utf8')
  : '';

const errors: string[] = [];
let lastTs = 0;
const seenHashes = new Set<string>();
const seenMemIds = new Set<string>();

for (const line of lines) {
  const parts = line.split('|').map((p) => p.trim());
  const hash = parts[0];
  const tsStr = parts[parts.length - 1];

  if (seenHashes.has(hash)) {
    errors.push(`duplicate commit ${hash}`);
  }
  seenHashes.add(hash);

  const ts = Date.parse(tsStr);
  if (!Number.isNaN(ts)) {
    if (ts <= lastTs) {
      const prev = new Date(lastTs).toISOString();
      errors.push(`timestamp out of order for ${hash}: ${tsStr} <= ${prev}`);
    }
    lastTs = ts;
  }

  try {
    execSync(`git cat-file -e ${hash}`, { cwd: repoRoot, stdio: 'ignore' });
  } catch {
    errors.push(`unknown commit ${hash}`);
    continue;
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
  }
}

if (errors.length) {
  console.error('Memory check failed:');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
} else {
  console.log('Memory check passed');
}
