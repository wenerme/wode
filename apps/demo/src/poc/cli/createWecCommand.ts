import { createGostCommand } from '@src/poc/cli/createGostCommand';
import { createMacosCommand } from '@src/poc/cli/createMacosCommand';
import { createNetflixCommand } from '@src/poc/cli/createNetflixCommand';
import { Command } from 'commander';

export function createWecCommand() {
  const root = new Command('wec');
  root
    .option('--debug', 'output extra debugging')
    .option('--dry-run', 'dry run')
    .version('0.0.1', '-v, --version', 'output the current version');

  root.addCommand(createNetflixCommand());
  root.addCommand(createGostCommand());

  if (process.platform === 'darwin') {
    root.addCommand(createMacosCommand());
  }

  return root;
}
