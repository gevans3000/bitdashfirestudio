import fs from 'fs';
import { memPath, snapshotPath } from './memory-utils';

const pattern = process.argv[2];
if (!pattern) {
  console.error('Usage: ts-node scripts/memgrep.ts <pattern>');
  process.exit(1);
}

const regex = new RegExp(pattern, 'i');

// Search memory.log
if (fs.existsSync(memPath)) {
  const lines = fs.readFileSync(memPath, 'utf8').split('\n');
  for (const line of lines) {
    if (regex.test(line)) {
      const hash = line.split('|')[0].trim();
      console.log(`${hash}: ${line.trim()}`);
    }
  }
}

// Search context.snapshot.md
if (fs.existsSync(snapshotPath)) {
  const lines = fs.readFileSync(snapshotPath, 'utf8').split('\n');
  let currentId = 'unknown';
  for (const raw of lines) {
    const line = raw.trimEnd();
    const header = line.match(/^### .*\| (mem-\d+)/);
    if (header) {
      currentId = header[1];
      continue;
    }
    if (regex.test(line)) {
      console.log(`${currentId}: ${line.trim()}`);
    }
  }
}
