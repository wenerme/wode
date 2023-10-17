import { assert, test } from 'vitest';
import { createUnpkg } from './createUnpkg';

test('Unpkg.getPackageVersionInfo', async () => {
  const r = await createUnpkg();
  const info = await r.getPackageVersionInfo('@wener/reaction');
  assert.equal(info.name, '@wener/reaction');
  assert.deepEqual(info, await r.getPackageVersionInfo(`${info.name}@${info.version}`));
});

test('Unpkg.getPackageVersionInfo resolve', async () => {
  const r = await createUnpkg();
  const info = await r.getPackageVersionInfo('@wener/reaction@^1');
  assert.equal(info.name, '@wener/reaction');
  assert.deepEqual(info, await r.getPackageVersionInfo(`${info.name}@${info.version}`));
});

test('Unpkg.getPackageTarball', async () => {
  const r = await createUnpkg();
  const tar = await r.getPackageTarball('@wener/reaction@1.2.12');
  assert.isTrue(tar instanceof Buffer);
});

test('Unpkg.getPackageFile', async () => {
  const r = await createUnpkg();
  const buf = await r.getPackageFile('@wener/reaction@1.2.15/package.json');
  const info = JSON.parse(buf.toString());
  assert.equal(info.name, '@wener/reaction');
  assert.equal(info.version, '1.2.15');
});
