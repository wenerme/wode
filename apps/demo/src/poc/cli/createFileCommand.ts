import fs from 'node:fs/promises';
import { Command } from 'commander';
import { runAction } from './run';

export function createFileCommand() {
  const root = new Command('file').argument('<files...>');
  root.command('stat').action(
    runAction(async ({ args: files }) => {
      const { fileTypeFromFile } = await import('file-type');
      for (let file of files) {
        const stat = await fs.stat(file);
        const ft = await fileTypeFromFile(file);
        console.log([file, stat.size, stat.blksize, ft?.ext, ft?.mime].filter(Boolean).join(' '));
      }
    }),
  );

  return root;
}
