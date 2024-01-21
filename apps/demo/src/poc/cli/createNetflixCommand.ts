import { run } from '@src/poc/cli/run';
import { runNetflixCheck } from '@src/poc/netflix/runNetflixCheck';
import { Command, Option } from 'commander';

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
