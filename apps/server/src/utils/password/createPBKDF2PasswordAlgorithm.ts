import { Errors } from '@wener/utils';
import { Password } from './Password';
import { PHC } from './PHC';

export function createPBKDF2PasswordAlgorithm({
  id,
  digest,
  iterations = 100000,
  saltlen = 16,
  keylen = digest === 'SHA-256' ? 32 : 64,
}: {
  id: string;
  digest: 'SHA-256' | 'SHA-512';
  iterations?: number;
  keylen?: number;
  saltlen?: number;
}): Password.PasswordAlgorithm {
  return {
    name: id,
    async hash(password: string, opts) {
      let salt: Uint8Array;

      if (opts?.salt) {
        salt = opts.salt;
      } else {
        salt = new Uint8Array(saltlen);
        crypto.getRandomValues(salt);
      }

      const rounds = opts?.rounds ?? iterations;

      let key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
        'deriveBits',
      ]);
      let hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', iterations: rounds, salt, hash: digest },
        key,
        keylen * 8,
      );
      return PHC.serialize({
        id: opts?.id ?? id,
        params: {
          rounds,
        },
        salt,
        hash: new Uint8Array(hash),
      });
    },
    async verify(password: string, _: string, opts) {
      const rounds = opts?.params?.rounds ?? iterations;
      const salt = opts.salt;
      const storedHash = opts.hash;
      Errors.BadRequest.check(typeof rounds === 'number', 'Invalid rounds');
      Errors.BadRequest.check(salt instanceof Uint8Array, 'Invalid salt');
      Errors.BadRequest.check(storedHash instanceof Uint8Array, 'Invalid hash');

      let key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
        'deriveBits',
      ]);
      let hash = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          iterations: rounds,
          salt,
          hash: digest,
        },
        key,
        storedHash.length * 8,
      );
      return new Uint8Array(hash).every((v, i) => v === storedHash![i]);
    },
  };
}
