import { Command } from 'commander';
import { KeychainAccess } from '../macos/KeychainAccess';

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
