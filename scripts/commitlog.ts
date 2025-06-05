import fs from 'fs';
import path from 'path';
import {
  memPath,
  readMemoryLines,
  atomicWrite,
  withFileLock,
  parseMemoryLines,
} from './memory-utils';

const log = parseMemoryLines(readMemoryLines())
  .slice(-20)
  .map((e) => e.raw)
  .join('\n');
const outPath = path.join(__dirname, '../logs/commit.log');
withFileLock(outPath, () => {
  atomicWrite(outPath, `${log}\n`);
});
console.log(`Commit log written to ${outPath}`);
