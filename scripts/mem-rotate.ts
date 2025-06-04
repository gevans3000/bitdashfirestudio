import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { repoRoot, memPath, readMemoryLines, atomicWrite, withFileLock } from './memory-utils';

const limit = parseInt(process.argv[2] || process.env.MEM_ROTATE_LIMIT || '200', 10);

const lines = readMemoryLines();

if (lines.length > limit) {
  const trimmed = lines.slice(-limit);
  const backupDir = path.join(repoRoot, 'logs');
  fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString();
  const backupPath = path.join(backupDir, `memory.log.${ts}.bak`);
  withFileLock(memPath, () => {
    atomicWrite(backupPath, lines.join('\n') + '\n');
    atomicWrite(memPath, trimmed.join('\n') + '\n');
  });
  console.log(`memory.log trimmed to last ${limit} entries`);
} else {
  console.log('memory.log already within limit');
}

execSync('ts-node scripts/commit-log.ts', { cwd: repoRoot, stdio: 'inherit' });
