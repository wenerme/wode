import { Password } from '@/utils/password/Password';

type ProviderType = () => Promise<Pick<typeof import('bcrypt'), 'hash' | 'compare'>>;

export function createBcryptPasswordAlgorithm({
  provider = () => import('bcrypt'),
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
