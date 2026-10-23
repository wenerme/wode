import { runWocli } from './node/run';

process.exitCode = await runWocli(process.argv.slice(2));
