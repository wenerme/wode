import { copy } from '@src/poc/cli/io';
import { runAction } from '@src/poc/cli/run';
import { runGostAutoSwitch } from '@src/poc/gost/runGostAutoSwitch';
import { Command } from 'commander';
import { $ } from 'execa';

export function createGostCommand() {
  const root = new Command('gost')
    .description('GO Simple Tunnel utils')
    .option('-c, --config <config>', 'gost config file');
  root.command('install').action(
    runAction(async () => {
      const $$ = $({ stdio: 'inherit' });
      // fetch latest version
      // download tar
      // extract
      // install binary
      // install service
      await copy({
        dest: '/etc/periodic/15min/gost-auto-switch',
        content: `#!/bin/sh
/usr/local/bin/wec.mjs gost auto-switch
`,
        // mode: '+x',
      });

      $$`chmod +x /etc/periodic/15min/gost-auto-switch`;
    }),
  );
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
