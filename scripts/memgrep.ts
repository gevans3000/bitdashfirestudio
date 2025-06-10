import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { memgrep } from './memory-cli';

const argv = yargs(hideBin(process.argv))
  .option('since', { type: 'string' })
  .option('until', { type: 'string' })
  .parseSync();

const [pattern] = argv._ as string[];
if (!pattern) {
  console.error('Usage: ts-node scripts/memgrep.ts <pattern> [--since <iso>] [--until <iso>]');
  process.exit(1);
}
memgrep(pattern, argv.since as string | undefined, argv.until as string | undefined);
