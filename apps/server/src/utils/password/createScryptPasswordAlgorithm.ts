import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { Errors } from '@wener/utils';
import { Password } from './Password';
import { PHC } from './PHC';

export function createScryptPasswordAlgorithm(
  options: {
    id?: string;
    cost?: number;
    blocksize?: number;
    parallelism?: number;
    saltlen?: number;
    keylen?: number;
  } = {},
): Password.PasswordAlgorithm {
  let id = options.id || 'scrypt';
  options.cost ||= Math.pow(2, 14);
  options.blocksize ||= 8;
  options.parallelism ||= 1;
  options.saltlen ||= 16;
  options.keylen ||= 32;
  return {
    name: id,
    async hash(password: string, opts): Promise<string> {
      const salt = opts?.salt || randomBytes(options.saltlen!);
      return new Promise((resolve, reject) => {
        let N = options.cost!;
        let r = options.blocksize!;
        let p = options.parallelism!;
        scrypt(password, salt, options.keylen!, { N, r, p }, (err, derivedKey) => {
          if (err) return reject(err);

          resolve(
            PHC.serialize({
              id: opts?.id ?? id,
              params: {
                ln: N!,
                r: r!,
                p: p!,
              },
              salt,
              hash: derivedKey,
            }),
          );
        });
      });
    },

    async verify(password: string, hash: string, opts): Promise<boolean> {
      try {
        const salt = Errors.BadRequest.require(opts.salt);
        const storedHash = Errors.BadRequest.require(opts.hash);

        const N = parseInt(opts.params?.ln as string, 10);
        const r = parseInt(opts.params?.r as string, 10);
        const p = parseInt(opts.params?.p as string, 10);
        const keylen = storedHash.length;

        return new Promise((resolve, reject) => {
          scrypt(password, salt, keylen, { N, r, p }, (err, derivedKey) => {
            if (err) return reject(err);

            const isMatch = timingSafeEqual(derivedKey, storedHash);
            resolve(isMatch);
          });
        });
      } catch (error) {
        return Promise.resolve(false);
      }
    },
  };
}
