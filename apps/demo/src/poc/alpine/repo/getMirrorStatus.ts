import { timeout } from '@wener/utils';
import dayjs from 'dayjs';
import { RepoClient } from './RepoClient';

export async function getMirrorStatus({
  client = new RepoClient(),
  mirrors,
}: {
  client?: RepoClient;
  mirrors?: string[];
} = {}) {
  mirrors ||= await client.getMirrors();
  const details = await Promise.all(
    mirrors.map(async (url) => {
      const start = Date.now();
      try {
        let lastUpdated = await timeout(client.with({ url }).getLastUpdated(), 5000);

        return {
          url,
          lastUpdated,
          delay: dayjs().startOf('hour').diff(lastUpdated, 'minute'),
          elapsed: Date.now() - start,
        };
      } catch (e) {
        return {
          url,
          error: String(e),
          delay: -1,
          elapsed: Date.now() - start,
        };
      }
    }),
  );

  details.sort((a, b) => {
    if (Boolean(a.error) !== Boolean(b.error)) {
      // 有错误在后面
      return a.error ? 1 : -1;
    }
    if (b.delay >= 0 && a.delay >= 0 && a.delay - b.delay) {
      // 小的在前面
      return a.delay - b.delay;
    }
    // 小的在前面
    return a.elapsed - b.elapsed;
  });
  return details;
}
