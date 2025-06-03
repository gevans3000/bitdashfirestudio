const fs = require('fs');
const path = require('path');

const memPath = path.join(__dirname, '../memory.log');
let lines = [];
if (fs.existsSync(memPath)) {
  lines = fs.readFileSync(memPath, 'utf8').trim().split('\n');
}
const log = lines.slice(-20).join('\n');
const outPath = path.join(__dirname, '../logs/commit.log');
fs.writeFileSync(outPath, log + '\n');
console.log(`Commit log written to ${outPath}`);

