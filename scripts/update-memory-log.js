const fs = require('fs');
const { execSync } = require('child_process');
const {
  repoRoot,
  memPath,
  readMemoryLines,
  formatMemoryEntry,
} = require('./memory-utils');

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
  ? `git log ${lastHash}..HEAD --reverse --name-only --pretty=format:%h\\|%s\\|%cI`
  : 'git log --reverse --name-only --pretty=format:%h\\|%s\\|%cI';

const raw = execSync(logCmd, { cwd: repoRoot, encoding: 'utf8' }).trim();
if (raw) {
  for (const block of raw.split('\n\n')) {
    const lines = block.split('\n').filter(Boolean);
    if (!lines.length) continue;
    const [h, s, d] = lines[0].split('|');
    const files = lines.slice(1).map((f) => f.trim());
    entries.push(
      formatMemoryEntry({
        hash: h,
        subject: s.trim(),
        files,
        date: d.trim(),
      })
    );
  }
}

fs.writeFileSync(memPath, entries.join('\n') + '\n');
console.log('memory.log updated');
