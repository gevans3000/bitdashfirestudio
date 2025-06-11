import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { checkMemory } from './memory-check.ts';
import {
  updateLog,
  snapshotUpdate,
  rebuildMemory,
  rotate,
} from './memory-logic.ts';

// Re-export functions for direct use, if needed elsewhere.
export * from './memory-logic';

function main(argv = hideBin(process.argv)): void {
  yargs(argv)
    .scriptName('memory')
    .command('rotate [limit]', 'Trim memory.log', (y) =>
      y.positional('limit', { type: 'number' }).option('dry-run', { type: 'boolean' }),
      (args) => rotate(args.limit as number | undefined, args.dryRun as boolean)
    )
    .command('update-log', 'Refresh memory.log from git history', (y) => y.option('verify', { type: 'boolean' }), (a) => updateLog(a.verify as boolean))
    .command('snapshot-update', 'Append last commit summary to snapshot', () => {}, () => snapshotUpdate())
    .command('rebuild [path]', 'Rebuild memory files from git history', (y) => y.positional('path', { type: 'string' }), (a) => rebuildMemory(a.path as string | undefined))
    .command('check', 'Verify memory files', () => {}, () => {
        const errors = checkMemory();
        if (errors.length) {
          console.error('Memory check failed:');
          for (const e of errors) console.error(`- ${e}`);
          process.exit(1);
        } else {
          console.log('Memory check passed');
        }
    })
    // Removed clean-locks command as locking is no longer used
    .demandCommand(1)
    .help()
    .strict()
    .parse();
}

// Run only when executed directly
if (require.main === module) {
  main();
}
