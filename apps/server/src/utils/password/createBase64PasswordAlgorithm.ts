import { ArrayBuffers } from '@wener/utils';
import { Password } from '@/utils/password/Password';

export function createBase64PasswordAlgorithm({ id = 'base64' }: { id?: string } = {}): Password.PasswordAlgorithm {
  return {
    name: id,
    async hash(password: string) {
      return `$${id}$$${ArrayBuffers.toBase64(password).replace(/=/g, '')}`;
    },
    async verify(password: string, hash: string, opts) {
      return Boolean(opts.hash) && ArrayBuffers.toString(opts.hash!) === password;
    },
  };
}
