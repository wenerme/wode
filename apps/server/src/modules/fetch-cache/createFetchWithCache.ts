import { createParser, type ParsedEvent } from 'eventsource-parser';
import { type EntityManager } from '@mikro-orm/postgresql';
import { HttpException, Logger } from '@nestjs/common';
import { classOf, type FetchLike } from '@wener/utils';
import { getEntityManager as _getEntityManager } from '../../app/mikro-orm/context';
import { FetchCache, type FetchCacheConfig, type FetchCacheHookContext } from './FetchCache';
import { HttpRequestLog } from './HttpRequestLog';
import { type FindCacheOptions } from './HttpRequestLog.repository';
import { removeNullChar } from './removeNullChar';

export interface CreateFetchWithCacheOptions {
  fetch?: FetchLike;
  logger?: Logger;
  config?: FetchCacheConfig;
  getEntityManager?: () => EntityManager;
  schema?: string;
}

function parseForm(o: URLSearchParams | string) {
  const p = typeof o === 'string' ? new URLSearchParams(o) : o;
  return Array.from(p.entries()).reduce<Record<string, string | string[]>>((o, [k, v]) => {
    const cv = o[k];
    o[k] = Array.isArray(cv) ? [...cv, v] : cv ? [cv, v] : v;
    return o;
  }, {});
}

export function createFetchWithCache({
  fetch = globalThis.fetch,
  logger: log = new Logger('FetchWithCache'),
  config: _config,
  getEntityManager = _getEntityManager,
  schema,
}: CreateFetchWithCacheOptions = {}): FetchLike {
  return async (url, init = {}) => {
    const e = new HttpRequestLog();
    if (schema) {
      e.setSchema(schema);
    }
    e.fromRequest(url, init);
    if (init?.body) {
      const requestContentType = e.requestHeaders?.['content-type']?.split(';')[0];

      const body = init.body;
      if (body instanceof FormData) {
        e.requestBody = await readStreamToBuffer(new Response(body).body!);
        e.requestPayload = Object.fromEntries(Array.from(body.entries()).filter(([k, v]) => typeof v === 'string'));
      } else if (body instanceof ReadableStream) {
        let rs;
        [init.body, rs] = body.tee();
        e.requestBody = await readStreamToBuffer(rs);
      } else if (typeof body === 'string') {
        switch (requestContentType) {
          case 'application/x-www-form-urlencoded': {
            e.requestPayload = parseForm(body);
            break;
          }
          default:
            if (body.startsWith('{') || requestContentType?.includes('json')) {
              e.requestPayload = removeNullChar(JSON.parse(body));
            } else {
              e.requestBody = Buffer.from(body);
            }
        }
      } else {
        log.warn(`Unknown body type ContentType=${requestContentType} ${typeof body} ${classOf(body)}`);
      }
    }

    const config = Object.assign({}, _config, FetchCache.getConfig());
    const ctx: FetchCacheHookContext = { entry: e, init, config: config || {}, hit: false };

    await config.onBeforeRequest?.(ctx);
    const em = getEntityManager().fork();

    const { expires, use = 'cache' } = config;
    if (use === 'cache' || use === 'cache-only') {
      const find: FindCacheOptions = {
        url: e.url,
        method: e.method,
        expires,
        cookie: e.requestHeaders?.cookie,
        requestPayload: e.requestPayload,
        schema,
      };
      const repo = em.getRepository(HttpRequestLog);

      const { cookie = true } = config.match || {};
      if (!cookie) {
        delete find.cookie;
      }
      const last: HttpRequestLog | null = await repo.findCache(find);
      if (last) {
        log.log(`cache hit [${last.id}]:${e.method} ${last.url}`);
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
        // avoid escape & data loss
        // case 'text/html':
        // case 'text/plain': {
        //   const body = await res.text();
        //   e.responsePayload = removeNullChar(body);
        //   e.contentLength ||= new TextEncoder().encode(body).length;
        //   res = new Response(body, res);
        //   break;
        // }
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

async function teeBuffer(rs: ReadableStream) {
  const [a, b] = rs.tee();
  const reader = b.getReader();
  const buffers = [];
  while (true) {
    const result = await reader.read();
    const { done, value } = result;
    if (value) {
      buffers.push(value);
    }
    if (done) {
      break;
    }
  }
  return [a, Buffer.concat(buffers)];
}

async function readStreamToBuffer(rs: ReadableStream) {
  const reader = rs.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
