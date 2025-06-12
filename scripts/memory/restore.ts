import fs from 'fs';
import {
  memPath,
  snapshotPath,
  atomicWrite,
  withFileLock,
} from '../memory-utils';

export function restore(backup: string, target: 'memory' | 'snapshot'): void {
  if (!fs.existsSync(backup)) {
    console.error(`Backup file not found: ${backup}`);
    process.exit(1);
  }

  const dest = target === 'memory' ? memPath : snapshotPath;
  const data = fs.readFileSync(backup, 'utf8');

  withFileLock(dest, () => {
    atomicWrite(dest, data);
  });
  console.log(`${dest} restored from ${backup}`);
}

if (require.main === module) {
  const [b, t] = process.argv.slice(2);
  if (!b || !t || (t !== 'memory' && t !== 'snapshot')) {
    console.error(
      'Usage: ts-node scripts/memory/restore.ts <backup-file> <memory|snapshot>',
    );
    process.exit(1);
  }
  restore(b, t as 'memory' | 'snapshot');
}
