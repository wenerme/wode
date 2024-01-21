import { run, runAction } from '@src/poc/cli/run';
import { runGostAutoSwitch } from '@src/poc/gost/runGostAutoSwitch';
import { Command } from 'commander';
import { $ } from 'execa';

export function createGostCommand() {
  const root = new Command('gost')
    .description('GO Simple Tunnel utils')
    .option('-c, --config <config>', 'gost config file');
  root
    .command('auto-switch')
    .description('auto switch gost proxy to available addr')
    .action(
      runAction(async ({ options }) => {
        const out = await runGostAutoSwitch({
          gost: {
            config: options.config,
          },
        });
        if (out.changed) {
          await $({ stdio: 'inherit', reject: false })`sudo service gost restart`;
        }
      }),
    );
  root.command('restart').action(async () => {
    await $({ stdio: 'inherit', reject: false })`sudo service gost restart`;
  });
  return root;
}
