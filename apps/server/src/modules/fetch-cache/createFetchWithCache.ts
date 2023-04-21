import { createParser, type ParsedEvent } from 'eventsource-parser';
import { HttpException, Logger } from '@nestjs/common';
import { type FetchLike } from '@wener/utils';
import { getEntityManager } from '../../app/mikro-orm/context';
import { FetchCache, FetchCacheConfig, FetchCacheHookContext } from './FetchCache';
import { HttpRequestLog } from './HttpRequestLog';
import { FindCacheOptions } from './HttpRequestLog.repository';
import { removeNullChar } from './removeNullChar';

export function createFetchWithCache({
  fetch = globalThis.fetch,
  logger: log = new Logger('FetchWithCache'),
  config: _config,
}: {
  fetch?: FetchLike;
  logger?: Logger;
  config?: FetchCacheConfig;
} = {}): FetchLike {
  return async (url, init = {}) => {
    const e = new HttpRequestLog();
    e.fromRequest(url, init);
    if (init?.body) {
      e.requestPayload = removeNullChar(JSON.parse(init.body as string));
    }

    const config = Object.assign({}, _config, FetchCache.getConfig());
    const ctx: FetchCacheHookContext = { entry: e, init, config: config || {}, hit: false };

    await config.onBeforeRequest?.(ctx);
    const em = getEntityManager({ fork: true });

    const { expires, use = 'cache' } = config;
    if (use === 'cache' || use === 'cache-only') {
      const find: FindCacheOptions = {
        url: e.url,
        method: e.method,
        expires,
        cookie: e.requestHeaders?.cookie,
        requestPayload: e.requestPayload,
      };
      const repo = em.getRepository(HttpRequestLog);

      const { cookie = true } = config.match || {};
      if (!cookie) {
        delete find.cookie;
      }
      const last: HttpRequestLog | null = await repo.findCache(find);
      if (last) {
        log.log(`${last.url} use cache: ${last.id}`);
        ctx.hit = true;
        ctx.entry = last;
        FetchCache.set(last, true);
        await config.onAfterRequest?.(ctx);
        return last.toResponse();
      }
      if (use === 'cache-only') {
        throw new HttpException('cache only not found', 500);
      }
    }

    // inflight request
    FetchCache.set(e, false);

    // random delay
    await config.onBeforeFetch?.(ctx);

    const start = Date.now();
    try {
      const signal = init?.signal;
      const abort = new Promise((resolve) => signal?.addEventListener('abort', resolve));
      let res = await fetch(url, init);
      e.fromResponse(res);
      const contentType = res.headers.get('content-type')?.split(';')[0];

      switch (contentType) {
        case 'application/json': {
          const text = await res.text();
          e.responsePayload = removeNullChar(JSON.parse(text));
          e.contentLength ||= new TextEncoder().encode(text).length;
          res = new Response(text, res);
          break;
        }
        case 'text/html':
        case 'text/plain': {
          const body = await res.text();
          e.responsePayload = removeNullChar(body);
          e.contentLength ||= new TextEncoder().encode(body).length;
          res = new Response(body, res);
          break;
        }

        case 'text/event-stream': {
          if (res.body instanceof ReadableStream) {
            const [a, b] = res.body.tee();
            void Promise.resolve().then(async () => {
              const reader = b.getReader();

              const events: Array<Omit<ParsedEvent, 'type'>> = [];
              const parser = createParser((e) => {
                if (e.type === 'event') {
                  const { type: _, ...evt } = e;
                  events.push(evt);
                }
              });
              const codec = new TextDecoder();
              while (true) {
                const result = await Promise.race([reader.read(), abort]);
                if (signal?.aborted) {
                  break;
                }
                const { done, value } = result as ReadableStreamReadResult<any>;
                if (value) {
                  parser.feed(typeof value === 'string' ? value : codec.decode(value));
                }
                if (done) {
                  break;
                }
              }

              e.responsePayload = events as any;
              await em.persistAndFlush(e);
            });
            res = new Response(a, res);
          }
          break;
        }
        default: {
          if (res.body instanceof ReadableStream) {
            const [a, b] = res.body.tee();
            void Promise.resolve().then(async () => {
              const reader = b.getReader();
              const buffers = [] as Array<Uint8Array>;
              while (true) {
                const result = await Promise.race([reader.read(), abort]);
                if (signal?.aborted) {
                  break;
                }
                //
                const { done, value } = result as ReadableStreamReadResult<any>;
                if (value) {
                  buffers.push(value);
                }
                if (done) {
                  break;
                }
              }

              e.responseBody = Buffer.concat(buffers);
              await em.persistAndFlush(e);
            });
            res = new Response(a, res);
          }
        }
      }
      return res;
    } finally {
      e.duration = Date.now() - start;
      e.ok = e.statusCode < 400;
      if (e.ok) {
        const code = e.responsePayload?.head?.code;
        if (code) {
          e.ok = parseInt(code) === 0;
        }
      }
      await em.persistAndFlush(e);
      await config.onAfterRequest?.(ctx);
    }
  };
}
