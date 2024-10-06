import { Command, Option } from 'commander';
import { runNetflixCheck } from '../netflix/runNetflixCheck';
import { run } from './run';

export function createNetflixCommand() {
  const nf = new Command('netflix').alias('nf').description('netflix related');
  nf.command('check')
    .description('check proxy for netflix')
    .argument('[proxy...]')
    .option('-a, --check-all', 'check all proxies')
    .addOption(new Option('-u, --username <username>', 'username for proxy').env('PROXY_USERNAME'))
    .addOption(new Option('-p, --password <password>', 'password for proxy').env('PROXY_PASSWORD'))
    .action(async (proxy, options, command) => {
      await run(() =>
        runNetflixCheck({
          proxy,
          username: options.username,
          password: options.password,
          checkAll: options.checkAll,
        }),
      );
    });
  return nf;
}
