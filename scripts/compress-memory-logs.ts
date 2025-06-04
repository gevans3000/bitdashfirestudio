import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { repoRoot } from './memory-utils';

const remove = process.argv.includes('--remove');
const days = parseInt(process.env.MEM_ARCHIVE_DAYS || '7', 10);
const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

const logsDir = path.join(repoRoot, 'logs');
const patterns = [/^memory\.log\..*\.bak$/, /^context\.snapshot\..*\.bak$/];

if (fs.existsSync(logsDir)) {
  for (const entry of fs.readdirSync(logsDir)) {
    if (!patterns.some((p) => p.test(entry))) continue;
    const file = path.join(logsDir, entry);
    try {
      const stat = fs.statSync(file);
      if (stat.mtimeMs >= cutoff) continue;
      const out = `${file}.gz`;
      if (fs.existsSync(out)) continue;
      const data = fs.readFileSync(file);
      fs.writeFileSync(out, zlib.gzipSync(data));
      if (remove) fs.unlinkSync(file);
      console.log(`compressed ${entry}`);
    } catch (err: any) {
      console.error(`Failed to compress ${entry}: ${err.message}`);
    }
  }
}
