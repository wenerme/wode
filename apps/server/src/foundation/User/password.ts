import { md5 } from '@wener/utils';
import { Password } from '@/utils/password';

export function verifyPassword({ password, hash }: { password: string; hash?: string }) {
  return checkPassword({ password, hash }).then((v) => v.match);
}

export function hashPassword(password: string) {
  return Password.hash(password);
}

export async function checkPassword({ password, hash }: { password: string; hash?: string }) {
  if (!hash || !password) {
    return {
      match: false,
    };
  }

  if (hash.startsWith('$')) {
    let result = await Password.check(password, hash);
    return {
      match: result.result,
      algorithm: result.parsed.id,
    };
  }

  // fixme rm legacy migration
  if (isMd5(hash)) {
    return {
      match: md5(password) === hash,
      algorithm: 'md5',
    };
  }

  if (password === hash) {
    return {
      match: true,
      algorithm: 'plain',
    };
  }

  throw new Error('Unknown password hash');
}

function isMd5(s: string) {
  return s.length === 32 && /^[a-f0-9]{32}$/.test(s);
}
