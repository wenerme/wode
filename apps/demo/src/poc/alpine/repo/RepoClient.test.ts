import { RepoClient } from '@src/poc/alpine/repo/RepoClient';
import { getMirrorStatus } from '@src/poc/alpine/repo/getMirrorStatus';
import { parseApkIndexArchive } from '@src/poc/alpine/repo/parseApkIndexArchive';
import { test } from 'vitest';

test(
  'mirror details',
  async () => {
    console.table(await getMirrorStatus());
  },
  { timeout: 10000 },
);

test('apkindex', async () => {
  const rc = new RepoClient();
  let data = await rc.request(rc.buildPackageIndexUrl()).then((v) => v.body!);
  const ar = await parseApkIndexArchive(data, {
    skip: ({ name }) => name === 'APKINDEX',
  });
  console.log(await rc.getLastUpdated(), ar.mtime, ar.description);
});

test('latest branch', async () => {
  const rc = new RepoClient();
  console.log(await rc.getLatestRelease());
});
