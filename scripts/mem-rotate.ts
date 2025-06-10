import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { rotate } from './memory-cli';

const argv = yargs(hideBin(process.argv)).option('dry-run', { type: 'boolean' }).parseSync();
const [limitArg] = argv._ as (string | number)[];
const limit = limitArg ? parseInt(limitArg as string, 10) : undefined;
rotate(limit, argv.dryRun as boolean);
