import fs from 'fs';
import path from 'path';
import {
  repoRoot,
  snapshotPath,
  atomicWrite,
  withFileLock,
} from './memory-utils';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find((a) => a !== '--dry-run');
const limit = parseInt(limitArg || process.env.SNAP_ROTATE_LIMIT || '100', 10);

if (!fs.existsSync(snapshotPath)) {
  console.log('context.snapshot.md not found');
  process.exit(0);
}

const raw = fs.readFileSync(snapshotPath, 'utf8');
const lines = raw.split('\n');
const headers: number[] = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('### ')) headers.push(i);
}

if (headers.length > limit) {
  const start = headers[headers.length - limit];
  const trimmed = lines.slice(start);
  const backupDir = path.join(repoRoot, 'logs');
  fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString();
  const backupPath = path.join(backupDir, `context.snapshot.${ts}.bak`);
  if (dryRun) {
    console.log(
      `[dry-run] Would backup to ${backupPath} and trim context.snapshot.md to last ${limit} entries`
    );
  } else {
    withFileLock(snapshotPath, () => {
      atomicWrite(backupPath, raw);
      atomicWrite(snapshotPath, trimmed.join('\n') + '\n');
    });
    console.log(`context.snapshot.md trimmed to last ${limit} entries`);
  }
} else {
  console.log('context.snapshot.md already within limit');
}
