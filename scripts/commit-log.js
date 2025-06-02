const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = execSync('git log --pretty=format:"%h %ad %s" --date=short -n 20', {
  encoding: 'utf8'
});
const outPath = path.join(__dirname, '../logs/commit.log');
fs.writeFileSync(outPath, log + '\n');
console.log(`Commit log written to ${outPath}`);

