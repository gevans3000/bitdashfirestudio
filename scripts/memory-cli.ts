import { spawnSync } from 'child_process';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { repoRoot } from './memory-utils';

const cmdArgs = hideBin(process.argv);

function run(script: string, args: string[]) {
  const result = spawnSync('ts-node', [path.join(__dirname, script), ...args], {
    stdio: 'inherit',
    cwd: repoRoot,
  });
  process.exitCode = result.status ?? undefined;
}

const commandMap: Record<string, string> = {
  rotate: 'mem-rotate.ts',
  'snapshot-rotate': 'snapshot-rotate.ts',
  status: 'mem-status.ts',
  grep: 'memgrep.ts',
  locate: 'mem-locate.ts',
  'update-log': 'update-memory-log.ts',
  list: 'mem-list.ts',
  diff: 'mem-diff.ts',
  json: 'memory-json.ts',
  'clean-locks': 'clean-locks.ts',
  check: 'memory-check.ts',
  restore: 'restore-memory.ts',
  rebuild: 'rebuild-memory.ts',
  sync: 'mem-sync.ts',
  'snapshot-update': 'update-snapshot.ts',
};

yargs(cmdArgs)
  .scriptName('memory')
  .usage('Usage: $0 <command> [args]')
  .command('rotate [limit]', 'Trim memory.log')
  .command('snapshot-rotate [limit]', 'Trim context.snapshot.md')
  .command('status', 'Print last entry and next task')
  .command('grep <pattern>', 'Search memory files')
  .command('locate <hash|mem-id>', 'Show snapshot entry for a commit')
  .command('update-log', 'Refresh memory.log from git history')
  .command('list', 'Show the last N entries')
  .command('diff', 'List commits missing from memory.log')
  .command('json', 'Export memory.log to memory.json')
  .command('clean-locks', 'Delete stale .lock files')
  .command('restore <backup> <memory|snapshot>',
    'Restore memory or snapshot file')
  .command('check', 'Verify memory files')
  .command('rebuild [path]', 'Rebuild memory files from git history')
  .command('sync <branch>', 'Merge memory.log from another branch')
  .command('snapshot-update', 'Append last commit summary to snapshot')
  .demandCommand(1, 'Specify a command')
  .help()
  .strict()
  .parseSync();

const [cmd, ...rest] = cmdArgs;
const script = commandMap[cmd];
if (script) {
  run(script, rest);
} else {
  console.error(`Unknown command: ${cmd}`);
  process.exitCode = 1;
}
