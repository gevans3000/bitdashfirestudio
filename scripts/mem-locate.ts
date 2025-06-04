import fs from 'fs';
import {
  readMemoryLines,
  parseMemoryLines,
  snapshotPath,
  parseSnapshotEntries,
} from './memory-utils';

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: ts-node scripts/mem-locate.ts <commit|mem-id>');
  process.exit(1);
}

const memEntries = parseMemoryLines(readMemoryLines());
const snapLines = fs.existsSync(snapshotPath)
  ? fs.readFileSync(snapshotPath, 'utf8').split('\n')
  : [];
const snapEntries = parseSnapshotEntries(snapLines);

let entry;
if (arg.startsWith('mem-')) {
  entry = snapEntries.find((e) => e.id === arg);
} else {
  const mem = memEntries.find((e) => e.hash.startsWith(arg));
  const hash = mem ? mem.hash : arg;
  entry = snapEntries.find((e) => e.commit.startsWith(hash));
}

if (entry) {
  console.log(entry.raw.trim());
}

