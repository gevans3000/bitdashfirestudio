const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const memPath = path.join(repoRoot, 'memory.log');
const snapshotPath = path.join(repoRoot, 'context.snapshot.md');

function readMemoryLines() {
  if (!fs.existsSync(memPath)) return [];
  return fs.readFileSync(memPath, 'utf8').trim().split('\n').filter(Boolean);
}

function nextMemId() {
  let last = 0;
  if (fs.existsSync(snapshotPath)) {
    const matches = fs
      .readFileSync(snapshotPath, 'utf8')
      .match(/mem-(\d+)/g);
    if (matches && matches.length) {
      const lastMatch = matches[matches.length - 1];
      last = parseInt(lastMatch.replace('mem-', ''), 10);
    }
  }
  return String(last + 1).padStart(3, '0');
}

module.exports = { repoRoot, memPath, snapshotPath, readMemoryLines, nextMemId };
