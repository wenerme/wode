import type { MaybePromise } from '@wener/utils';
import { Password } from './Password';

type ProviderType = () => MaybePromise<{
  hash: (password: string, rounds: number | string) => Promise<string>;
  compare: (password: string, hash: string) => Promise<boolean>;
}>;

export function createBcryptPasswordAlgorithm({
  // provider = () => import('bcrypt').then((v) => v.default),
  provider = () => import('bcryptjs').then((v) => v.default),
}: {
  provider?: ProviderType;
} = {}): Password.PasswordAlgorithm {
  // bcrypt or bcryptjs
  return {
    name: 'bcrypt',
    async hash(password: string, opts) {
      const { hash } = await provider();
      return hash(password, opts?.rounds ?? 10);
    },
    async verify(password: string, hash: string) {
      const { compare } = await provider();
      if (hash.startsWith('$2y$')) {
        hash = hash.replace(/^\$2y\$/, '$2a$');
      }
      return compare(password, hash);
    },
  };
}
