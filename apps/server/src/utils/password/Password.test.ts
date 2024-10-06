import { describe, expect, test } from 'vitest';
import { createArgon2PasswordAlgorithm } from '@/utils/password/createArgon2PasswordAlgorithm';
import { createBase64PasswordAlgorithm } from '@/utils/password/createBase64PasswordAlgorithm';
import { createBcryptPasswordAlgorithm } from '@/utils/password/createBcryptPasswordAlgorithm';
import { Password } from '@/utils/password/Password';

describe('Password', () => {
  const check = async ({
    password = '1',
    ...rest
  }: Password.PasswordHashOptions & {
    password?: string;
  }) => {
    let out = await Password.hash(password, rest);
    let result = await Password.verify(password, out);
    expect(result).toBe(true);
    console.log(`${rest.algorithm || 'default'}: hash: ${out}`);
  };

  Password.addAlgorithm(createBcryptPasswordAlgorithm());
  Password.addAlgorithm(createBase64PasswordAlgorithm());
  Password.addAlgorithm(createArgon2PasswordAlgorithm());

  test('base', async () => {
    await check({});

    await check({ algorithm: 'bcrypt' });

    await check({ algorithm: 'base64' });
    // invalid base 64
    await check({ algorithm: 'base64', password: '你好' });

    await check({ algorithm: '5' });
    await check({ algorithm: '6' });
  });

  test('case', async () => {
    const tests: Array<{
      password?: string;
      hash: string;
    }> = [
      { hash: '$2y$10$MQ057tMbDG6/lVkGFWrNwOR9kh/5rzbkhBPrwNPTPuZ5wBpGNbWLa' },
      { hash: '$argon2i$v=19$m=16,t=2,p=1$SDZBU29LRUp0eTJyRDJqZg$76L95nAjG4SjjdoR0YZyFw' },
      { hash: '$argon2d$v=19$m=16,t=2,p=1$SDZBU29LRUp0eTJyRDJqZg$+cB2R45sauVlfxbGslAmOw' },
      { hash: '$argon2id$v=19$m=16,t=2,p=1$SDZBU29LRUp0eTJyRDJqZg$iP9HYuSDXgG2lW7KARBuQQ' },
    ];

    for (const { password = '1', hash } of tests) {
      expect(await Password.verify(password, hash)).toBe(true);
    }
  });
});
