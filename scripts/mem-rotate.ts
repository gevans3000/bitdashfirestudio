import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  repoRoot,
  memPath,
  readMemoryLines,
  atomicWrite,
  withFileLock,
} from './memory-utils';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find((a) => a !== '--dry-run');
const limit = parseInt(limitArg || process.env.MEM_ROTATE_LIMIT || '200', 10);

const lines = readMemoryLines();

if (lines.length > limit) {
  const trimmed = lines.slice(-limit);
  const backupDir = path.join(repoRoot, 'logs');
  fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString();
  const backupPath = path.join(backupDir, `memory.log.${ts}.bak`);
  if (dryRun) {
    console.log(
      `[dry-run] Would backup to ${backupPath} and trim memory.log to last ${limit} entries`
    );
  } else {
    withFileLock(memPath, () => {
      atomicWrite(backupPath, lines.join('\n') + '\n');
      atomicWrite(memPath, trimmed.join('\n') + '\n');
    });
    console.log(`memory.log trimmed to last ${limit} entries`);
  }
} else {
  console.log('memory.log already within limit');
}

if (dryRun) {
  console.log('[dry-run] Skipping commit-log update');
} else {
  execSync('ts-node scripts/commit-log.ts', { cwd: repoRoot, stdio: 'inherit' });
  try {
    execSync('ts-node scripts/memory-check.ts', {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  } catch (err: any) {
    process.exit(err.status || 1);
  }
}
