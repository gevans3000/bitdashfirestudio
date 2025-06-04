import fs from 'fs';
import { execSync } from 'child_process';
import { repoRoot, memPath, readMemoryLines } from './memory-utils';

const limit = parseInt(process.argv[2] || process.env.MEM_ROTATE_LIMIT || '200', 10);

const lines = readMemoryLines();

if (lines.length > limit) {
  const trimmed = lines.slice(-limit);
  fs.writeFileSync(memPath, trimmed.join('\n') + '\n');
  console.log(`memory.log trimmed to last ${limit} entries`);
} else {
  console.log('memory.log already within limit');
}

execSync('ts-node scripts/commit-log.ts', { cwd: repoRoot, stdio: 'inherit' });
