import fs from 'fs';
import {
  readMemoryLines,
  parseMemoryLines,
  snapshotPath,
  parseSnapshotEntries,
} from './memory-utils';

const [fromId, toId] = process.argv.slice(2);

if (!fromId || !toId) {
  console.error('Usage: ts-node scripts/mem-summary.ts <from> <to>');
  process.exit(1);
}

const snapLines = fs.existsSync(snapshotPath)
  ? fs.readFileSync(snapshotPath, 'utf8').split('\n')
  : [];
const snapEntries = parseSnapshotEntries(snapLines);

const fromIdx = snapEntries.findIndex((e) => e.id === fromId);
const toIdx = snapEntries.findIndex((e) => e.id === toId);

if (fromIdx === -1 || toIdx === -1) {
  console.error('mem-id not found in snapshot');
  process.exit(1);
}

const start = Math.min(fromIdx, toIdx);
const end = Math.max(fromIdx, toIdx);

const memMap = new Map(
  parseMemoryLines(readMemoryLines()).map((e) => [e.hash, e.summary])
);

for (const entry of snapEntries.slice(start, end + 1)) {
  const summary = memMap.get(entry.commit) || entry.summary;
  console.log(`${entry.id}: ${summary}`);
}
