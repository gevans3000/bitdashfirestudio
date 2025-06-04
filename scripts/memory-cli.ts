import { spawnSync } from 'child_process';
import path from 'path';
import minimist from 'minimist';
import { repoRoot } from './memory-utils';

const argv = minimist(process.argv.slice(2));
const [cmd, ...rest] = argv._;

function run(script: string, args: string[]) {
  const result = spawnSync(
    'ts-node',
    [path.join(__dirname, script), ...args],
    { stdio: 'inherit', cwd: repoRoot }
  );
  process.exitCode = result.status ?? undefined;
}

function help() {
  console.log(`Usage: npm run memory -- <command> [args]

Commands:
  rotate [limit] [--dry-run]       Trim memory.log
  snapshot-rotate [limit] [--dry-run]  Trim context.snapshot.md
  status                           Print last entry and next task
  grep <pattern>                   Search memory files
  locate <hash|mem-id>             Show snapshot entry for a commit
  update-log [--verify]            Refresh memory.log from git history
`);
}

if (!cmd || argv.help) {
  help();
  process.exit(cmd ? 1 : 0);
}

switch (cmd) {
  case 'rotate':
    run('mem-rotate.ts', rest);
    break;
  case 'snapshot-rotate':
    run('snapshot-rotate.ts', rest);
    break;
  case 'status':
    run('mem-status.ts', rest);
    break;
  case 'grep':
    run('memgrep.ts', rest);
    break;
  case 'locate':
    run('mem-locate.ts', rest);
    break;
  case 'update-log':
    run('update-memory-log.ts', rest);
    break;
  default:
    console.error(`Unknown command: ${cmd}`);
    help();
    process.exitCode = 1;
}
