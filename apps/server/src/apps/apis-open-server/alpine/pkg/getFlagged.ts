import { JSDOM } from 'jsdom';
import { z } from 'zod';
import { FetchLike, Logger } from '@wener/utils';

export async function getFlagged({
  logger = console,
  fetch = globalThis.fetch,
}: {
  logger?: Logger;
  fetch?: FetchLike;
} = {}): Promise<FlaggedPackage[]> {
  let all: FlaggedPackage[] = [];
  let page = 1;
  while (true) {
    // slow
    const {
      window: { document },
    } = new JSDOM(await fetch(`https://pkgs.alpinelinux.org/flagged?page=${page}`).then((v) => v.text()));
    const $$ = document.querySelectorAll.bind(document);
    const items: FlaggedPackage[] = Array.from($$('table tr'))
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
    logger.info({ page, items: items.length }, 'getFlagged');
    page++;
    all.push(...items);
    if (items.length < 50) {
      break;
    }
  }
  return all;
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
