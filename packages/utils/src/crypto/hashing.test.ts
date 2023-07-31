import { test, beforeAll, expect } from 'vitest';
import { polyfillCrypto } from '../servers/polyfill/polyfillCrypto';
import { isUUID } from '../validations/isUUID';
import { hex } from './base';
import { sha1, sha256, sha384, sha512 } from './hashing';
import { _randomUUID } from './randomUUID';

beforeAll(async () => {
  await polyfillCrypto();
});

test('sha', async () => {
  expect(hex(await sha1(''))).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  expect(hex(await sha1('abc'))).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  expect(hex(await sha256(''))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  expect(hex(await sha384(''))).toBe(
    '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
  );
  expect(hex(await sha512(''))).toBe(
    'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
  );
});

test('randomUUID', () => {
  for (let i = 0; i < 20; i++) {
    expect(isUUID(_randomUUID())).toBeTruthy();
  }
});
