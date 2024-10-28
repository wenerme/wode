import { Errors } from '@wener/utils';
import { createScryptPasswordAlgorithm } from './createScryptPasswordAlgorithm';
import { createPBKDF2PasswordAlgorithm } from './createPBKDF2PasswordAlgorithm';
import { PHC } from './PHC';

export namespace Password {
  export interface ParsedPassword {
    id: string;
    version?: number;
    params?: Record<string, string | number>;
    salt?: Uint8Array;
    hash?: Uint8Array;
  }

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
  let DefaultAlgorithm: string = '7';

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

  addAlgorithm(
    createPBKDF2PasswordAlgorithm({
      id: 'sha256',
      digest: 'SHA-256',
    }),
  );
  addAlgorithm(
    createPBKDF2PasswordAlgorithm({
      id: 'sha512',
      digest: 'SHA-512',
    }),
  );
  addAlgorithm(createScryptPasswordAlgorithm({}));

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
