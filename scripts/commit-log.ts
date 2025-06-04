import fs from 'fs';
import path from 'path';
import { memPath, readMemoryLines } from './memory-utils';

const log = readMemoryLines().slice(-20).join('\n');
const outPath = path.join(__dirname, '../logs/commit.log');
fs.writeFileSync(outPath, `${log}\n`);
console.log(`Commit log written to ${outPath}`);
