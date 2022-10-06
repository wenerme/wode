import test from 'ava';
import { polyfillFetch } from '@wener/utils/server';
import { createUnpkg } from './createUnpkg';

test.before(async () => {
  await polyfillFetch();
});

test.only('Unpkg.getPackageVersionInfo', async (t) => {
  const r = await createUnpkg();
  const info = await r.getPackageVersionInfo('@wener/reaction');
  t.is(info.name, '@wener/reaction');
  t.deepEqual(info, await r.getPackageVersionInfo(`${info.name}@${info.version}`));
});

test.only('Unpkg.getPackageVersionInfo resolve', async (t) => {
  const r = await createUnpkg();
  const info = await r.getPackageVersionInfo('@wener/reaction@^1');
  t.is(info.name, '@wener/reaction');
  t.deepEqual(info, await r.getPackageVersionInfo(`${info.name}@${info.version}`));
});

test('Unpkg.getPackageTarball', async (t) => {
  const r = await createUnpkg();
  const tar = await r.getPackageTarball('@wener/reaction@1.2.12');
  t.truthy(tar instanceof Buffer);
});

test('Unpkg.getPackageFile', async (t) => {
  const r = await createUnpkg();
  const buf = await r.getPackageFile('@wener/reaction@1.2.12/package.json');
  const info = JSON.parse(buf.toString());
  t.is(info.name, '@wener/reaction');
  t.is(info.version, '1.2.12');
});
