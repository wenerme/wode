import type { EntityRepository } from '@mikro-orm/postgresql';
import { HttpException, Logger } from '@nestjs/common';
import { ArrayBuffers, classOf, type FetchLike } from '@wener/utils';
import { createParser, type ParsedEvent } from 'eventsource-parser';
import type { BaseHttpRequestLogEntity } from './BaseHttpRequestLogEntity';
import { FetchCache, type FetchCacheConfig, type FetchCacheHookContext, type FetchCacheOptions } from './FetchCache';
import { findHttpRequestCache, type FindCacheOptions } from './findHttpRequestCache';
import { removeNullChar } from './removeNullChar';

export interface CreateFetchWithCacheOptions<T extends BaseHttpRequestLogEntity> {
  fetch?: FetchLike;
  logger?: Logger;
  config?: FetchCacheConfig;
  repo: EntityRepository<T>;
}

function parseForm(o: URLSearchParams | string) {
  const p = typeof o === 'string' ? new URLSearchParams(o) : o;
  return Array.from(p.entries()).reduce<Record<string, string | string[]>>((o, [k, v]) => {
    const cv = o[k];
    o[k] = Array.isArray(cv) ? [...cv, v] : cv ? [cv, v] : v;
    return o;
  }, {});
}

export function createFetchWithCache<T extends BaseHttpRequestLogEntity>({
  fetch = globalThis.fetch,
  logger: log = new Logger('FetchWithCache'),
  config: _config,
  repo,
}: CreateFetchWithCacheOptions<T>): FetchLike {
  return async (
    url,
    {
      $cache,
      ...init
    }: RequestInit & {
      $cache?: FetchCacheOptions;
    } = {},
  ) => {
    const config = Object.assign({}, _config, FetchCache.getConfig());
    const e = repo.create({} as any, { persist: false }) as BaseHttpRequestLogEntity;
    e.fromRequest(url, init);
    const ctx: FetchCacheHookContext = { entry: e, init, config: config || {}, hit: false };
    if (config.use === 'skip') {
      return fetch(url, init);
    }

    const em = repo.getEntityManager().fork();

    async function onBeforeRequest() {
      await config.onBeforeRequest?.(ctx);
      await $cache?.onBeforeRequest?.(ctx);
    }

    async function onAfterRequest() {
      await config.onAfterRequest?.(ctx);
      await $cache?.onAfterRequest?.(ctx);
    }

    async function onBeforeFetch() {
      await config.onBeforeFetch?.(ctx);
      await $cache?.onBeforeFetch?.(ctx);
    }

    await onBeforeRequest();

    if (init?.body) {
      const requestContentType = e.requestHeaders?.['content-type']?.split(';')[0];
      const body = init.body;

      const getText = async () => {
        if (typeof body === 'string') {
          return body;
        }

        if (ArrayBuffers.isArrayBuffer(body)) {
          return Buffer.from(body).toString('utf-8');
        }
      };
      const getBinary = () => {
        if (body instanceof ReadableStream) {
          let rs;
          [init.body, rs] = body.tee();
          return readStreamToBuffer(rs);
        }
        if (ArrayBuffers.isArrayBuffer(body)) {
          return Buffer.from(body);
        }
      };
      switch (requestContentType) {
        case 'application/json': {
          {
            // avoid readable stream lock
            const text = await new Response(init.body).text();
            e.requestPayload = removeNullChar(JSON.parse(text));
            init.body = text;
          }
          break;
        }
        case 'application/x-www-form-urlencoded':
          {
            let text = await getText();
            if (text) {
              e.requestPayload = parseForm(text);
            }
            //   if (body instanceof FormData) {
            //     e.requestBody = await readStreamToBuffer(new Response(body).body!);
            //     e.requestPayload = Object.fromEntries(Array.from(body.entries()).filter(([k, v]) => typeof v === 'string'));
            //   }
          }
          break;
        case 'multipart/form-data':
          e.requestBody = await getBinary();
          break;
      }

      if (!e.requestBody && !e.requestPayload) {
        log.warn(`skip body data ContentType=${requestContentType} ${typeof body} ${classOf(body)}`);
      }
    }

    const { expires, use = 'cache' } = { ...config, ...$cache };
    if (use === 'cache' || use === 'cache-only') {
      const find: FindCacheOptions = {
        url: e.url,
        method: e.method,
        expires,
        cookie: e.requestHeaders?.cookie,
        requestPayload: e.requestPayload,
      };

      const { cookie = true } = config.match || {};
      if (!cookie) {
        delete find.cookie;
      }
      const last: BaseHttpRequestLogEntity | null = await findHttpRequestCache(repo, find);
      if (last) {
        log.log(`cache hit [${last.id}]:${e.method} ${last.url}`);
        ctx.hit = true;
        ctx.entry = last;
        FetchCache.set(last, true);
        await onAfterRequest();
        return last.toResponse();
      }
      if (use === 'cache-only') {
        throw new HttpException('cache not found in cache-only mode', 500);
      }
    }

    // inflight request
    FetchCache.set(e, false);

    await onBeforeFetch();

    const start = Date.now();
    const signal = init?.signal;
    const abort = new Promise((resolve) => signal?.addEventListener('abort', resolve));
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (error) {
      e.duration = Date.now() - start;
      e.ok = false;
      e.statusCode = 0;
      e.properties ||= {};
      if (error instanceof Error) {
        e.properties.error = {
          message: error.message,
          stack: error.stack,
        };
      } else {
        e.properties.error = {
          message: String(error),
        };
      }

      throw e;
    }
    try {
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
      e.ok = (e.statusCode ?? 0) < 400;
      if (e.ok) {
        const code = e.responsePayload?.head?.code;
        if (code) {
          e.ok = parseInt(code) === 0;
        }
      }
      if (!ctx.hit) {
        await em.persistAndFlush(e);
      }
      await onAfterRequest();
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
