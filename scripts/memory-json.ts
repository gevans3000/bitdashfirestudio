import path from 'path';
import { repoRoot, readMemoryLines, atomicWrite, withFileLock } from './memory-utils';

const lines = readMemoryLines();
const entries = lines.map((line) => {
  const parts = line.split('|').map((p) => p.trim());
  const hash = parts[0];
  const summary = parts.length === 5 ? parts[2] : parts[1];
  const filesPart = parts.length === 5 ? parts[3] : parts[2];
  const timestamp = parts[parts.length - 1];
  const files = filesPart.split(',').map((f) => f.trim()).filter(Boolean);
  return { hash, summary, files, timestamp };
});

const outPath = path.join(repoRoot, 'memory.json');
withFileLock(outPath, () => {
  atomicWrite(outPath, JSON.stringify(entries, null, 2) + '\n');
});
console.log(`memory.json written to ${outPath}`);
