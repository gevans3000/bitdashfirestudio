const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const memPath = path.join(repoRoot, 'memory.log');

function readMemoryLines() {
  if (!fs.existsSync(memPath)) return [];
  return fs.readFileSync(memPath, 'utf8').trim().split('\n').filter(Boolean);
}

function formatMemoryEntry({ hash, subject, files, date }) {
  return `${hash} | ${subject} | ${files.join(', ')} | ${date}`;
}
module.exports = { repoRoot, memPath, readMemoryLines, formatMemoryEntry };
