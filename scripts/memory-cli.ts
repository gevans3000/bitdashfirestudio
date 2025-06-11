import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  repoRoot,
  memPath,
  snapshotPath,
  readMemoryLines,
  atomicWrite,
  withFileLock,
  parseMemoryLines,
  parseSnapshotEntries,
  nextMemId,
} from './memory-utils';
import { cleanLocks } from './clean-locks';

export function rotate(limit = parseInt(process.env.MEM_ROTATE_LIMIT || '200', 10), dryRun = false): void {
  const lines = readMemoryLines();
  if (lines.length > limit) {
    const trimmed = lines.slice(-limit);
    const backupDir = path.join(repoRoot, 'logs');
    fs.mkdirSync(backupDir, { recursive: true });
    const ts = new Date().toISOString();
    const backupPath = path.join(backupDir, `memory.log.${ts}.bak`);
    if (dryRun) {
      console.log(`[dry-run] Would backup to ${backupPath} and trim memory.log to last ${limit} entries`);
    } else {
      withFileLock(memPath, () => {
        atomicWrite(backupPath, lines.join('\n') + '\n');
        atomicWrite(memPath, trimmed.join('\n') + '\n');
      });
      console.log(`memory.log trimmed to last ${limit} entries`);
    }
  } else {
    console.log('memory.log already within limit');
  }
  if (!dryRun) {
    try {
      execSync('ts-node scripts/memory-check.ts', { cwd: repoRoot, stdio: 'inherit' });
    } catch (err: any) {
      process.exit(err.status || 1);
    }
  } else {
    console.log('[dry-run] Skipping memory-check');
  }
}

export function archiveFiles(): void {
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
}

export function snapshotRotate(limit = parseInt(process.env.SNAP_ROTATE_LIMIT || '100', 10), dryRun = false): void {
  if (!fs.existsSync(snapshotPath)) {
    console.log('context.snapshot.md not found');
    return;
  }
  const raw = fs.readFileSync(snapshotPath, 'utf8');
  const lines = raw.split('\n');
  const headers: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('### ')) headers.push(i);
  }
  if (headers.length > limit) {
    const start = headers[headers.length - limit];
    const trimmed = lines.slice(start);
    const backupDir = path.join(repoRoot, 'logs');
    fs.mkdirSync(backupDir, { recursive: true });
    const ts = new Date().toISOString();
    const backupPath = path.join(backupDir, `context.snapshot.${ts}.bak`);
    if (dryRun) {
      console.log(`[dry-run] Would backup to ${backupPath} and trim context.snapshot.md to last ${limit} entries`);
    } else {
      withFileLock(snapshotPath, () => {
        atomicWrite(backupPath, raw);
        atomicWrite(snapshotPath, trimmed.join('\n') + '\n');
      });
      console.log(`context.snapshot.md trimmed to last ${limit} entries`);
    }
  } else {
    console.log('context.snapshot.md already within limit');
  }
}

export function memStatus(): void {
  const lines = readMemoryLines();
  const entries = parseMemoryLines(lines);
  const last = entries.length ? entries[entries.length - 1].raw : 'none';
  let task = 'none';
  const tasksPath = path.join(repoRoot, 'TASKS.md');
  if (fs.existsSync(tasksPath)) {
    const tLines = fs.readFileSync(tasksPath, 'utf8').split('\n');
    const pending = tLines.find((l) => l.startsWith('- [ ] '));
    if (pending) task = pending.replace(/^- \[ \] /, '').trim();
  }
  const id = nextMemId();
  console.log(`${last}\nmem-${id}\n${task}`);
}

export function memgrep(pattern: string, since?: string, until?: string): void {
  const sinceTs = since ? Date.parse(since) : NaN;
  const untilTs = until ? Date.parse(until) : NaN;
  const regex = new RegExp(pattern, 'i');
  if (fs.existsSync(memPath)) {
    const lines = fs.readFileSync(memPath, 'utf8').split('\n');
    for (const line of lines) {
      if (!regex.test(line)) continue;
      const parts = line.split('|');
      const ts = Date.parse(parts[parts.length - 1].trim());
      if ((!Number.isNaN(sinceTs) && ts < sinceTs) || (!Number.isNaN(untilTs) && ts > untilTs)) continue;
      const hash = parts[0].trim();
      console.log(`${hash}: ${line.trim()}`);
    }
  }
  if (fs.existsSync(snapshotPath)) {
    const lines = fs.readFileSync(snapshotPath, 'utf8').split('\n');
    let currentId = 'unknown';
    let currentTs = NaN;
    for (const raw of lines) {
      const line = raw.trimEnd();
      const header = line.match(/^###\s+([^|]+)\s*\|\s*(mem-\d+)/);
      if (header) {
        currentTs = Date.parse(header[1].trim());
        currentId = header[2];
        continue;
      }
      if (!regex.test(line)) continue;
      if ((!Number.isNaN(sinceTs) && currentTs < sinceTs) || (!Number.isNaN(untilTs) && currentTs > untilTs)) continue;
      console.log(`${currentId}: ${line.trim()}`);
    }
  }
}

export function memDiff(): void {
  const memHashes = new Set(readMemoryLines().map((l) => l.split('|')[0].trim()));
  const gitHashes = execSync('git log --pretty=%h --no-merges', { cwd: repoRoot })
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);
  const missing = gitHashes.filter((h) => !memHashes.has(h));
  if (missing.length) {
    console.log(missing.join('\n'));
  } else {
    console.log('All commits present in memory.log');
  }
}

export function memList(limit = 10): void {
  const lines = readMemoryLines();
  const entries = parseMemoryLines(lines);
  const slice = entries.slice(-limit);
  for (const e of slice) console.log(e.raw);
}

export function memLocate(arg: string): void {
  const memEntries = parseMemoryLines(readMemoryLines());
  const snapLines = fs.existsSync(snapshotPath)
    ? fs.readFileSync(snapshotPath, 'utf8').split('\n')
    : [];
  const snapEntries = parseSnapshotEntries(snapLines);
  let entry;
  if (arg.startsWith('mem-')) {
    entry = snapEntries.find((e) => e.id === arg);
  } else {
    const mem = memEntries.find((e) => e.hash.startsWith(arg));
    const hash = mem ? mem.hash : arg;
    entry = snapEntries.find((e) => e.commit.startsWith(hash));
  }
  if (entry) console.log(entry.raw.trim());
}

export function memSync(branch: string): void {
  let otherLog = '';
  try {
    otherLog = execSync(`git show ${branch}:memory.log`, {
      cwd: repoRoot,
      encoding: 'utf8',
    });
  } catch {
    console.error(`Unable to read memory.log from ${branch}`);
    process.exit(1);
  }
  const otherLines = otherLog.trim().split('\n').filter(Boolean);
  const localLines = readMemoryLines();
  const combined = parseMemoryLines([...localLines, ...otherLines]);
  combined.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of combined) {
    if (seen.has(entry.hash)) continue;
    seen.add(entry.hash);
    result.push(entry.raw.trim());
  }
  withFileLock(memPath, () => {
    atomicWrite(memPath, result.join('\n') + '\n');
  });
  console.log('memory.log synchronized');
}

export function updateLog(verify = false): void {
  let entries = readMemoryLines();
  let lastHash = '';
  if (entries.length) {
    const candidate = entries[entries.length - 1].split(' | ')[0];
    try {
      execSync(`git cat-file -e ${candidate}`, { cwd: repoRoot, stdio: 'ignore' });
      lastHash = candidate;
    } catch {
      lastHash = '';
    }
  }
  const logCmd = lastHash
    ? `git log ${lastHash}..HEAD --reverse --pretty=format:%h\\|%s\\|%cI --name-only`
    : 'git log --reverse --pretty=format:%h\\|%s\\|%cI --name-only';
  const lines = execSync(logCmd, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: '/bin/bash',
  })
    .trim()
    .split('\n');
  let current: { h: string; s: string; d: string; f: string[] } | undefined;
  for (const line of lines) {
    if (!line) continue;
    if (line.includes('|')) {
      if (current) {
        entries.push(`${current.h} | ${current.s} | ${current.f.join(', ')} | ${current.d}`);
      }
      const [h, s, d] = line.split('|');
      current = { h, s: s.trim(), d: d.trim(), f: [] };
    } else if (current) {
      current.f.push(line.trim());
    }
  }
  if (current) {
    entries.push(`${current.h} | ${current.s} | ${current.f.join(', ')} | ${current.d}`);
  }
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const line of entries) {
    const hash = line.split('|')[0].trim();
    if (seen.has(hash)) continue;
    seen.add(hash);
    uniq.push(line);
  }
  entries = uniq;
  withFileLock(memPath, () => {
    atomicWrite(memPath, entries.join('\n') + '\n');
  });
  console.log('memory.log updated');
  if (verify) {
    try {
      execSync('ts-node scripts/memory-check.ts', { cwd: repoRoot, stdio: 'inherit' });
    } catch (err: any) {
      process.exit(err.status || 1);
    }
  }
}

export function memoryJson(): void {
  const lines = readMemoryLines();
  const entries = lines.map((line) => {
    const parts = line.split('|').map((p) => p.trim());
    const hash = parts[0];
    const summary = parts.length === 5 ? parts[2] : parts[1];
    const filesPart = parts.length === 5 ? parts[3] : parts[2];
    const timestamp = parts[parts.length - 1];
    const files = filesPart.split(',').map((f) => f.trim()).filter(Boolean);
    return { hash, summary, files, timestamp };
  });
  const outPath = path.join(repoRoot, 'memory.json');
  withFileLock(outPath, () => {
    atomicWrite(outPath, JSON.stringify(entries, null, 2) + '\n');
  });
  console.log(`memory.json written to ${outPath}`);
}

export function restoreMemory(backup: string, target: 'memory' | 'snapshot'): void {
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

export function rebuildMemory(pathArg?: string): void {
  const repo = pathArg ? path.resolve(pathArg) : repoRoot;
  const memFile = path.join(repo, 'memory.log');
  const snapFile = path.join(repo, 'context.snapshot.md');
  if (fs.existsSync(memFile)) fs.unlinkSync(memFile);
  if (fs.existsSync(snapFile)) fs.unlinkSync(snapFile);
  const raw = execSync('git log --reverse --pretty=format:%h|%s|%cI --name-only', { cwd: repo, encoding: 'utf8' });
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
  const original = execSync('git rev-parse --abbrev-ref HEAD || git rev-parse HEAD', { cwd: repo, encoding: 'utf8', shell: '/bin/bash' }).trim();
  const append = path.join(__dirname, 'append-memory.ts');
  for (const e of entries) {
    execSync(`git checkout ${e.h} --quiet`, { cwd: repo, stdio: 'ignore' });
    execSync(`ts-node ${append} ${JSON.stringify(e.s)} ${JSON.stringify('rebuild')}`, { cwd: repo, stdio: 'ignore', shell: '/bin/bash' });
  }
  execSync(`git checkout ${original} --quiet`, { cwd: repo, stdio: 'ignore' });
  const linesOut = entries.map((e) => `${e.h} | ${e.s} | ${e.f.join(', ')} | ${e.d}`);
  withFileLock(memFile, () => {
    atomicWrite(memFile, linesOut.join('\n') + '\n');
  });
  console.log('memory.log and context.snapshot.md rebuilt');
}

export function snapshotUpdate(): void {
  function lastCommitSummary(): string {
    const out = execSync('git log -1 --pretty=format:%s%n%n%b', { cwd: repoRoot, encoding: 'utf8' }).trim();
    return out || 'No summary';
  }
  function nextOpenTask(): string {
    try {
      const cmd = "grep -m 1 '^- \[ \]' TASKS.md | sed -E 's/^- \[ \] //'";
      const task = execSync(cmd, { cwd: repoRoot, shell: '/bin/bash', encoding: 'utf8' }).trim();
      return task || 'none';
    } catch {
      return 'none';
    }
  }
  const summary = lastCommitSummary();
  const nextTask = nextOpenTask();
  execSync(`ts-node scripts/append-memory.ts ${JSON.stringify(summary)} ${JSON.stringify(nextTask)}`, { cwd: repoRoot, stdio: 'inherit', shell: '/bin/bash' });
}

export function main(argv = hideBin(process.argv)): void {
  yargs(argv)
    .scriptName('memory')
    .command('rotate [limit]', 'Trim memory.log', (y) =>
      y.positional('limit', { type: 'number' }).option('dry-run', { type: 'boolean' }),
      (args) => rotate(args.limit as number | undefined, args.dryRun as boolean)
    )
    .command('snapshot-rotate [limit]', 'Trim context.snapshot.md', (y) =>
      y.positional('limit', { type: 'number' }).option('dry-run', { type: 'boolean' }),
      (args) => snapshotRotate(args.limit as number | undefined, args.dryRun as boolean)
    )
    .command('archive', 'Move memory.log and snapshot to logs/archive', () => {}, () => archiveFiles())
    .command('status', 'Print last entry and next task', () => {}, () => memStatus())
    .command('grep <pattern>', 'Search memory files', (y) =>
      y.positional('pattern', { type: 'string' })
        .option('since', { type: 'string' })
        .option('until', { type: 'string' }),
      (args) => memgrep(args.pattern as string, args.since as string | undefined, args.until as string | undefined)
    )
    .command('diff', 'List commits missing from memory.log', () => {}, () => memDiff())
    .command('list [limit]', 'Show the last N entries', (y) => y.option('limit', { alias: 'n', type: 'number' }), (a) => memList(a.limit as number | undefined))
    .command('locate <target>', 'Show snapshot entry for a commit', (y) => y.positional('target', { type: 'string' }), (a) => memLocate(a.target as string))
    .command('update-log', 'Refresh memory.log from git history', (y) => y.option('verify', { type: 'boolean' }), (a) => updateLog(a.verify as boolean))
    .command('json', 'Export memory.log to memory.json', () => {}, () => memoryJson())
    .command('clean-locks', 'Delete stale .lock files', () => {}, () => cleanLocks())
    .command('restore <backup> <dest>', 'Restore memory or snapshot file', (y) =>
      y.positional('backup', { type: 'string' })
        .positional('dest', { choices: ['memory', 'snapshot'] as const }),
      (a) => restoreMemory(a.backup as string, a.dest as 'memory' | 'snapshot')
    )
    .command('check', 'Verify memory files', () => {}, () => require('./memory-check.ts'))
    .command('rebuild [path]', 'Rebuild memory files from git history', (y) => y.positional('path', { type: 'string' }), (a) => rebuildMemory(a.path as string | undefined))
    .command('sync <branch>', 'Merge memory.log from another branch', (y) => y.positional('branch', { type: 'string' }), (a) => memSync(a.branch as string))
    .command('snapshot-update', 'Append last commit summary to snapshot', () => {}, () => snapshotUpdate())
    .demandCommand(1)
    .help()
    .strict()
    .parse();
}

if (require.main === module) {
  main();
}
