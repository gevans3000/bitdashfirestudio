const fs = require('fs');
const path = require('path');
const { memPath, readMemoryLines } = require('./memory-utils');

const log = readMemoryLines().slice(-20).join('\n');
const outPath = path.join(__dirname, '../logs/commit.log');
fs.writeFileSync(outPath, `${log}\n`);
console.log(`Commit log written to ${outPath}`);

