import fs from 'fs';
import { execSync } from 'child_process';
import { repoRoot, readMemoryLines, snapshotPath } from './memory-utils';

const lines = readMemoryLines();
const snapshot = fs.existsSync(snapshotPath)
  ? fs.readFileSync(snapshotPath, 'utf8')
  : '';

const errors: string[] = [];

for (const line of lines) {
  const hash = line.split('|')[0].trim();
  if (!hash) continue;
  try {
    execSync(`git cat-file -e ${hash}`, { cwd: repoRoot, stdio: 'ignore' });
  } catch {
    errors.push(`unknown commit ${hash}`);
    continue;
  }
  const pattern = new RegExp(`mem-\\d+[\\s\\S]*?Commit SHA: ${hash}\\b`);
  if (!pattern.test(snapshot)) {
    errors.push(`snapshot missing block for ${hash}`);
  }
}

if (errors.length) {
  console.error('Memory check failed:');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
} else {
  console.log('Memory check passed');
}
