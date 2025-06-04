import fs from 'fs';
import { execSync } from 'child_process';
import { repoRoot, memPath, readMemoryLines, atomicWrite, withFileLock } from './memory-utils';

let entries = readMemoryLines();
let lastHash = '';
if (entries.length) {
  const candidate = entries[entries.length - 1].split(' | ')[0];
  try {
    execSync(`git cat-file -e ${candidate}`, { cwd: repoRoot, stdio: 'ignore' });
    lastHash = candidate;
  } catch {
    lastHash = '';
  }
}

const logCmd = lastHash
  ? `git log ${lastHash}..HEAD --reverse --pretty=format:%h\\|%s\\|%cI --name-only`
  : 'git log --reverse --pretty=format:%h\\|%s\\|%cI --name-only';

const lines = execSync(logCmd, { cwd: repoRoot, encoding: 'utf8' })
  .trim()
  .split('\n');

let current: { h: string; s: string; d: string; f: string[] } | undefined;
for (const line of lines) {
  if (!line) continue;
  if (line.includes('|')) {
    if (current) {
      entries.push(`${current.h} | ${current.s} | ${current.f.join(', ')} | ${current.d}`);
    }
    const [h, s, d] = line.split('|');
    current = { h, s: s.trim(), d: d.trim(), f: [] };
  } else if (current) {
    current.f.push(line.trim());
  }
}
if (current) {
  entries.push(`${current.h} | ${current.s} | ${current.f.join(', ')} | ${current.d}`);
}

// remove duplicate hashes while preserving order
const uniq: string[] = [];
const seen = new Set<string>();
for (const line of entries) {
  const hash = line.split('|')[0].trim();
  if (seen.has(hash)) continue;
  seen.add(hash);
  uniq.push(line);
}
entries = uniq;

withFileLock(memPath, () => {
  atomicWrite(memPath, entries.join('\n') + '\n');
});
console.log('memory.log updated');

if (process.argv.includes('--verify')) {
  try {
    execSync('ts-node scripts/memory-check.ts', {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  } catch (err: any) {
    process.exit(err.status || 1);
  }
}
