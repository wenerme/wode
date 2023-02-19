import { getLogger } from 'common/src/trpc/server/logger';
import { JSDOM } from 'jsdom';
import LRUCache from 'lru-cache';
import { z } from 'zod';
import { ms } from '@wener/utils';

const cache = new LRUCache({
  ttl: 1000 * 60 * 5, // 5min
  max: 1000,
});

export async function getFlagged(): Promise<FlaggedPackage[]> {
  const cached = cache.get('flagged');
  if (cached) {
    return cached as Promise<FlaggedPackage[]>;
  }
  let value = Promise.resolve().then(async () => {
    let all: FlaggedPackage[] = [];
    let page = 1;
    while (true) {
      // 一次性拉取所有会导致 vercel 超时 - 10s
      let items: FlaggedPackage[] = cache.get(`flagged.${page}`) as any;
      if (!items) {
        const {
          window: { document },
        } = await JSDOM.fromURL(`https://pkgs.alpinelinux.org/flagged?page=${page}`);
        const $$ = document.querySelectorAll.bind(document);
        items = Array.from($$('table tr'))
          .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent?.trim()))
          .slice(1)
          .map(([origin, version, next, repo, maintainer, flaggedAt]) => ({
            origin,
            version,
            next,
            repo,
            maintainer,
            flaggedAt,
          }))
          .filter((v) => v.next) as FlaggedPackage[];
        cache.set(`flagged.${page}`, items);
      }

      getLogger().info({ page, items: items.length }, 'getFlagged');
      page++;
      all.push(...items);
      if (items.length < 50) {
        break;
      }
    }
    return all;
  });
  cache.set('flagged', value, {
    ttl: ms('10m'),
  });
  return value;
}

export const FlaggedPackage = z.object({
  origin: z.string(),
  version: z.string(),
  next: z.string(),
  repo: z.string(),
  maintainer: z.string(),
  flaggedAt: z.string().or(z.date()),
});
export type FlaggedPackage = z.infer<typeof FlaggedPackage>;
