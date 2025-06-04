const fs = require('fs');
const { execSync } = require('child_process');
const { repoRoot, memPath, readMemoryLines } = require('./memory-utils');

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

let current;
for (const line of lines) {
  if (!line) continue;
  if (line.includes('|')) {
    if (current) {
      entries.push(
        `${current.h} | ${current.s} | ${current.f.join(', ')} | ${current.d}`
      );
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

fs.writeFileSync(memPath, entries.join('\n') + '\n');
console.log('memory.log updated');
