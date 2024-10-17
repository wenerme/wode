import type { MaybePromise } from '../asyncs/MaybePromise';
import { getGlobalThis } from '../runtime/getGlobalThis';
import type { FetchLike } from './types';

export function createFetchWith({
  fetch = getGlobalThis().fetch,
  onRequest = (ctx) => ctx.next(ctx.url, ctx.req),
  onResponse = (ctx) => ctx.res,
}: {
  fetch?: FetchLike;
  onRequest?: (ctx: {
    url: string;
    req: RequestInit;
    next: (url: string, req: RequestInit) => Promise<Response>;
  }) => MaybePromise<Response | void>;
  onResponse?: (ctx: { url: string; req: RequestInit; res: Response }) => MaybePromise<Response>;
}) {
  return async (urlOrRequest: string | URL | Request, init?: RequestInit & { fetch?: FetchLike }) => {
    const url = String(urlOrRequest);
    let req = init || {};
    const nextFetch = req.fetch || fetch;
    const res =
      (await onRequest({
        url,
        req,
        next: (url, init) => {
          req = init;
          return nextFetch(url, init);
        },
      })) ?? (await nextFetch(url, init));
    return onResponse({ url, req, res });
  };
}
