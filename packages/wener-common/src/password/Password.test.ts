import { describe, expect, test } from 'vitest';
import { createArgon2PasswordAlgorithm } from './createArgon2PasswordAlgorithm';
import { createBase64PasswordAlgorithm } from './createBase64PasswordAlgorithm';
import { createBcryptPasswordAlgorithm } from './createBcryptPasswordAlgorithm';
import { Password } from './Password';

describe('Password', () => {
  const check = async ({
    password = '1',
    ...rest
  }: Password.PasswordHashOptions & {
    password?: string;
  }) => {
    let out = await Password.hash(password, rest);
    console.log(`${rest.algorithm || 'default'}: hash ${out}`);
    let result = await Password.verify(password, out);
    expect(result).toBe(true);
  };

  Password.addAlgorithm(createBcryptPasswordAlgorithm());
  Password.addAlgorithm(createBase64PasswordAlgorithm());
  Password.addAlgorithm(
    createArgon2PasswordAlgorithm({
      provide: import('argon2'),
    }),
  );
  // Password.addAlgorithm(createScryptPasswordAlgorithm());

  test('base', async () => {
    await check({});

    await check({ algorithm: 'bcrypt' });

    await check({ algorithm: 'base64' });
    // invalid base 64
    await check({ algorithm: 'base64', password: '你好' });

    await check({ algorithm: '5' });
    await check({ algorithm: '6' });
    await check({ algorithm: '7' });
  });

  test('should verify manual created hash', async () => {
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
