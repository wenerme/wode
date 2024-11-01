import { test } from 'vitest';
import { getMirrorStatus } from '@/poc/alpine/repo/getMirrorStatus';
import { parseApkIndexArchive } from '@/poc/alpine/repo/parseApkIndexArchive';
import { RepoClient } from '@/poc/alpine/repo/RepoClient';

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
