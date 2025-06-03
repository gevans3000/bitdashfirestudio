const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const memoryMd = path.join(repoRoot, 'memory.md');
const snapshot = path.join(repoRoot, 'context.snapshot.md');
const out = path.join(repoRoot, 'memory.log');

const entries = new Map();

function add(line) {
  const hash = line.split('|')[0].trim();
  if (!entries.has(hash)) entries.set(hash, line.trim());
}

if (fs.existsSync(memoryMd)) {
  const lines = fs.readFileSync(memoryMd, 'utf8').split('\n');
  lines.filter(l => /^[0-9a-f]{7}/.test(l)).forEach(add);
}

if (fs.existsSync(snapshot)) {
  const lines = fs.readFileSync(snapshot, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Task:')) {
      const task = lines[i].slice(5).trim();
      const ts = lines[i + 1]?.replace('Timestamp:', '').trim();
      const commit = lines[i + 2]?.replace('Commit:', '').trim();
      const filesLine = lines[i + 3] || '';
      const files = filesLine.startsWith('Files:') ? filesLine.slice(7).trim() : '';
      const summary = lines[i - 1] ? lines[i - 1].trim() : task;
      const entry = `${commit} | ${task} | ${summary} | ${files} | ${ts}`;
      add(entry);
    }
  }
}

fs.writeFileSync(out, Array.from(entries.values()).join('\n') + '\n');
console.log(`Migrated ${entries.size} entries to memory.log`);
