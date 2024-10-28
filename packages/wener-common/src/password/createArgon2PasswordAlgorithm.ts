import { maybeFunction, type MaybeFunction, type MaybePromise } from '@wener/utils';
import { Password } from './Password';

type Provide = {
  hash: (password: string, options: { salt?: Buffer; raw?: boolean; type?: 0 | 1 | 2 }) => Promise<string>;
  verify: (hash: string, password: string) => Promise<boolean>;
};

export function createArgon2PasswordAlgorithm({
  type,
  provide = async () => {
    throw new Error('Please provide argon2');
    // const { default: wasm } = await import('argon2-browser/dist/argon2.wasm');
    // const argon2 = await WebAssembly.instantiateStreaming(fetch(wasm), {
    //   env: {
    //     memoryBase: 0,
    //     tableBase: 0,
    //     memory: new WebAssembly.Memory({ initial: 256 }),
    //     table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
    //     __memory_base: 0,
    //     __table_base: 0,
    //   },
    // });
    // console.log(argon2.instance.exports);
    // const { hash } = argon2.instance.exports as any as typeof import('argon2-browser');
  },
  // argon2-browser/dist/argon2-bundled.min.js
  // import('argon2-browser').then(({ default: { hash, verify } }) => {
  //   return {
  //     hash(password, options) {
  //       return hash({
  //         pass: password,
  //       });
  //     },
  //     verify(hash, password) {
  //       return verify({
  //         pass: password,
  //         hash: hash,
  //       })
  //         .then(() => true)
  //         .catch(() => false);
  //     },
  //   };
  // }),
  // provide = () => import('argon2'),
}: {
  type?: 'argon2d' | 'argon2i' | 'argon2id';
  provide?: MaybeFunction<MaybePromise<Provide>>;
} = {}): Password.PasswordAlgorithm {
  // 0=Argon2d, 1=Argon2i, 2=Argon2id
  const toType: Record<string, 0 | 1 | 2 | undefined> = {
    argon2d: 0,
    argon2i: 1,
    argon2id: 2,
  } as const;

  let mod: Provide;
  const resolve = () => {
    if (mod) return mod;
    return Promise.resolve(maybeFunction(provide)).then((v) => (mod = v));
  };
  return {
    name: 'argon2',
    ids: ['argon2i', 'argon2d', 'argon2id'],
    async hash(password: string, opts) {
      // const { hash } = await import('argon2');
      const { hash } = await resolve();
      const id = opts?.id;
      return hash(password, {
        salt: opts?.salt ? Buffer.from(opts.salt) : undefined,
        raw: false,
        type: toType[id || ''] ?? toType[type || ''],
      });
    },
    async verify(password: string, hash: string) {
      const { verify } = await resolve();
      return verify(hash, password);
    },
  };
}
