import { KeychainAccess } from '@src/poc/macos/KeychainAccess';
import { Command } from 'commander';

export function createMacosCommand() {
  const macos = new Command('macos').alias('mac');
  const keyaccess = macos.command('keyaccess').alias('ka');
  keyaccess
    .command('find-generic-password')
    .option('--service <service>')
    .action(async (options) => {
      const ka = new KeychainAccess();
      console.log(await ka.findGenericPassword(options));
    });
  return macos;
}
