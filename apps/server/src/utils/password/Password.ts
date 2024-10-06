import { Errors } from '@wener/utils';
import { PHC } from '@/utils/password/PHC';

export namespace Password {
  type PasswordAlgorithmHashOptions = {
    rounds?: number;
    salt?: Uint8Array;
    id?: string;
  };
  type PasswordAlgorithmVerifyOptions = ParsedPassword;
  export type PasswordAlgorithm = {
    readonly name: string;
    readonly ids?: string[];
    hash(password: string, opts?: PasswordAlgorithmHashOptions): Promise<string>;
    verify(password: string, hash: string, opts: PasswordAlgorithmVerifyOptions): Promise<boolean>;
  };

  const Algorithms: Record<string, string | PasswordAlgorithm> = {
    1: 'md5',
    '2a': 'bcrypt', // original
    '2b': 'bcrypt', // February 2014
    '2x': 'bcrypt', // June 2011
    '2y': 'bcrypt', // June 2011
    5: 'sha256',
    6: 'sha512',
    7: 'scrypt',
  };
  let DefaultAlgorithm: string = '6';

  export function setDefaultAlgorithm(algorithm: string) {
    Errors.BadRequest.check(Algorithms[algorithm], `Unknown algorithm ${algorithm}`);
    DefaultAlgorithm = algorithm;
  }

  export function getDefaultAlgorithm() {
    return DefaultAlgorithm;
  }

  export function addAlgorithm(algorithm: PasswordAlgorithm) {
    Algorithms[algorithm.name] = algorithm;
    if (algorithm.ids) {
      for (const id of algorithm.ids) {
        Algorithms[id] = algorithm;
      }
    }
  }

  function createPBKDF2Algorithm({
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
  }): PasswordAlgorithm {
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
      async verify(password: string, _: string, opts: PasswordAlgorithmVerifyOptions) {
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

  Algorithms['sha256'] = createPBKDF2Algorithm({
    id: 'sha256',
    digest: 'SHA-256',
  });

  Algorithms['sha512'] = createPBKDF2Algorithm({
    id: 'sha512',
    digest: 'SHA-512',
  });

  export interface ParsedPassword {
    id: string;
    version?: number;
    params?: Record<string, string | number>;
    salt?: Uint8Array;
    hash?: Uint8Array;
  }

  export async function parse(hash: string) {
    return PHC.deserialize(hash);
  }

  function resolveAlgorithm(id: string | PasswordAlgorithm): PasswordAlgorithm {
    let f = id;
    while (typeof f === 'string') {
      f = Algorithms[f];
    }
    if (!f) {
      throw new Error(`Unknown algorithm ${id}`);
    }
    return f;
  }

  export async function check(password: string, hash: string) {
    let res = await parse(hash);
    let f = resolveAlgorithm(res.id);
    return {
      result: f.verify(password, hash, res),
      parsed: res,
    };
  }

  export async function verify(password: string, hash: string) {
    let res = await parse(hash);
    let f = resolveAlgorithm(res.id);
    return f.verify(password, hash, res);
  }

  export type PasswordHashOptions = PasswordAlgorithmHashOptions & {
    algorithm?: string | PasswordAlgorithm;
  };

  export async function hash(password: string, { algorithm, ...opts }: PasswordHashOptions = {}) {
    let f = resolveAlgorithm(algorithm ?? DefaultAlgorithm);
    let id = algorithm ?? DefaultAlgorithm;
    typeof id !== 'string' && (id = f.name);
    return f.hash(password, {
      id,
      ...opts,
    });
  }
}
