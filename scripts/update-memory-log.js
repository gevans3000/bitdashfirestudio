const fs = require('fs');
const path = require('path');
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
  ? `git log ${lastHash}..HEAD --reverse --pretty=format:%h\\|%s\\|%cI`
  : "git log --reverse --pretty=format:%h\\|%s\\|%cI";
const commitLines = execSync(logCmd, { cwd: repoRoot, encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

for (const line of commitLines) {
  const [hash, subject, date] = line.split('|');
  const files = execSync(`git show --pretty=format:'' --name-only ${hash}`, {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean)
    .join(', ');
  const entry = `${hash} | ${subject.trim()} | ${files} | ${date.trim()}`;
  entries.push(entry);
}

fs.writeFileSync(memPath, entries.join('\n') + '\n');
console.log('memory.log updated');
