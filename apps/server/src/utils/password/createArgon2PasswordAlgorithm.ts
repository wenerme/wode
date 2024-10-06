import { Password } from '@/utils/password';

export function createArgon2PasswordAlgorithm({
  type,
}: {
  type?: 'argon2d' | 'argon2i' | 'argon2id';
} = {}): Password.PasswordAlgorithm {
  // 0=Argon2d, 1=Argon2i, 2=Argon2id
  const toType: Record<string, 0 | 1 | 2 | undefined> = {
    argon2d: 0,
    argon2i: 1,
    argon2id: 2,
  } as const;
  return {
    name: 'argon2',
    ids: ['argon2i', 'argon2d', 'argon2id'],
    async hash(password: string, opts) {
      const { hash } = await import('argon2');
      const id = opts?.id;
      return hash(password, {
        salt: opts?.salt ? Buffer.from(opts.salt) : undefined,
        raw: false,
        type: toType[id || ''] ?? toType[type || ''],
      });
    },
    async verify(password: string, hash: string) {
      const { verify } = await import('argon2');
      return verify(hash, password);
    },
  };
}
