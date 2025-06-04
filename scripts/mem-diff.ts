import { execSync } from 'child_process';
import { readMemoryLines, repoRoot } from './memory-utils';

const memHashes = new Set(
  readMemoryLines().map((line) => line.split('|')[0].trim())
);

const gitHashes = execSync('git log --pretty=%h --no-merges', {
  cwd: repoRoot,
})
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

const missing = gitHashes.filter((h) => !memHashes.has(h));

if (missing.length) {
  console.log(missing.join('\n'));
} else {
  console.log('All commits present in memory.log');
}
