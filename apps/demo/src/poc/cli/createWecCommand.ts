import { Command } from 'commander';
import { createFileCommand } from './createFileCommand';
import { createGostCommand } from './createGostCommand';
import { createMacosCommand } from './createMacosCommand';
import { createNetflixCommand } from './createNetflixCommand';

export function createWecCommand() {
  const root = new Command('wec');
  root
    .option('--debug', 'output extra debugging')
    .option('--dry-run', 'dry run')
    .version('0.0.1', '-v, --version', 'output the current version');

  root.addCommand(createNetflixCommand());
  root.addCommand(createGostCommand());
  root.addCommand(createFileCommand());
  if (process.platform === 'darwin') {
    root.addCommand(createMacosCommand());
  }

  return root;
}
