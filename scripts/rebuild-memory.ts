import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { atomicWrite, withFileLock, repoRoot as defaultRoot } from './memory-utils';

function parseLog(repo: string) {
  const raw = execSync(
    'git log --reverse --pretty=format:%h|%s|%cI --name-only',
    { cwd: repo, encoding: 'utf8' }
  );
  const lines = raw.trim().split('\n');
  const entries: { h: string; s: string; d: string; f: string[] }[] = [];
  let cur: { h: string; s: string; d: string; f: string[] } | undefined;
  for (const line of lines) {
    if (!line) continue;
    if (line.includes('|')) {
      if (cur) entries.push(cur);
      const [h, s, d] = line.split('|');
      cur = { h: h.trim(), s: s.trim(), d: d.trim(), f: [] };
    } else if (cur) {
      cur.f.push(line.trim());
    }
  }
  if (cur) entries.push(cur);
  return entries;
}

function rebuildMemory(repo: string) {
  const memFile = path.join(repo, 'memory.log');
  const snapFile = path.join(repo, 'context.snapshot.md');
  if (fs.existsSync(memFile)) fs.unlinkSync(memFile);
  if (fs.existsSync(snapFile)) fs.unlinkSync(snapFile);

  const entries = parseLog(repo);

  const original = execSync('git rev-parse --abbrev-ref HEAD || git rev-parse HEAD', {
    cwd: repo,
    encoding: 'utf8',
    shell: '/bin/bash',
  }).trim();

  const append = path.join(__dirname, 'append-memory.ts');
  for (const e of entries) {
    execSync(`git checkout ${e.h} --quiet`, { cwd: repo, stdio: 'ignore' });
    execSync(`ts-node ${append} ${JSON.stringify(e.s)} ${JSON.stringify('rebuild')}`,
      { cwd: repo, stdio: 'ignore', shell: '/bin/bash' });
  }
  execSync(`git checkout ${original} --quiet`, { cwd: repo, stdio: 'ignore' });

  const lines = entries.map((e) => `${e.h} | ${e.s} | ${e.f.join(', ')} | ${e.d}`);
  withFileLock(memFile, () => {
    atomicWrite(memFile, lines.join('\n') + '\n');
  });
  console.log('memory.log and context.snapshot.md rebuilt');
}

const repo = process.argv[2] ? path.resolve(process.argv[2]) : defaultRoot;
rebuildMemory(repo);
