import fs from 'fs';
import path from 'path';
import { repoRoot, memPath, snapshotPath, withFileLock } from '../memory-utils';

const archiveDir = path.join(repoRoot, 'logs', 'archive');
fs.mkdirSync(archiveDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:]/g, '-');

function move(src: string, name: string) {
  if (!fs.existsSync(src)) {
    console.log(`${name} not found`);
    return;
  }
  const dest = path.join(archiveDir, `${name}.${ts}`);
  withFileLock(src, () => {
    fs.renameSync(src, dest);
  });
  console.log(`Archived ${name} to ${dest}`);
}

move(memPath, 'memory.log');
move(snapshotPath, 'context.snapshot.md');
