import test from 'ava';
import { sha1, sha256, sha384, sha512 } from './hashing';
import { hex } from './hex';
import { randomUUID } from './randomUUID';

test.before(async (t) => {
  if (!('crypto' in globalThis)) {
    (globalThis as any).crypto = (await import('node:crypto')).webcrypto;
    t.log(`load node:crypto`);
  }
});

test('sha', async (t) => {
  t.is(hex(await sha1('')), 'da39a3ee5e6b4b0d3255bfef95601890afd80709');
  t.is(hex(await sha1('abc')), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  t.is(hex(await sha256('')), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  t.is(
    hex(await sha384('')),
    '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
  );
  t.is(
    hex(await sha512('')),
    'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
  );
  t.regex(randomUUID(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
