import { assert, beforeAll, expect, test } from 'vitest';
import { ArrayBuffers } from '../io/ArrayBuffers';
import { polyfillCrypto } from '../server/polyfill/polyfillCrypto';
import { isUUID } from '../validations/isUUID';
import { _randomUUID } from '../web/randomUUID';
import { hex } from './base';
import { hmac, sha1, sha256, sha384, sha512 } from './hashing';
import { md5 } from './md5';

beforeAll(async () => {
  await polyfillCrypto();
});

test('sha', async () => {
  expect(hex(await sha1(''))).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  expect(await sha1('', 'hex')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  expect(ArrayBuffers.toString(await sha1(''), 'base64')).toBe('2jmj7l5rSw0yVb/vlWAYkK/YBwk=');
  expect(await sha1('', 'base64')).toBe('2jmj7l5rSw0yVb/vlWAYkK/YBwk=');

  expect(await sha1('', 'hex')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  expect(hex(await sha1('abc'))).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  expect(hex(await sha256(''))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  expect(hex(await sha384(''))).toBe(
    '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
  );
  expect(hex(await sha512(''))).toBe(
    'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
  );

  expect(md5('Hello')).toBe('8b1a9953c4611296a827abf8c47804d7');
});

test('randomUUID', () => {
  for (let i = 0; i < 20; i++) {
    expect(isUUID(_randomUUID())).toBeTruthy();
  }
});

test('hmac', async () => {
  let key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('YourAccessKeySecret'),
    {
      name: 'HMAC',
      hash: {
        name: 'SHA-256',
      },
    },
    false,
    ['sign', 'verify'],
  );
  const out = hex(
    await crypto.subtle.sign(
      {
        name: 'HMAC',
        hash: {
          name: 'SHA-256',
        },
      },
      key,
      new TextEncoder().encode(''),
    ),
  );
  console.log(out);
  const { createHmac } = await import('node:crypto');
  let fromNode = createHmac('sha256', 'YourAccessKeySecret').update('').digest('hex');
  assert.equal(out, fromNode);
  assert.equal(out, await hmac('sha256', 'YourAccessKeySecret', '', 'hex'));
});
