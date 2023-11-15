import { swagger } from '@elysiajs/swagger';
import { MemoryCacheAdapter, ReflectMetadataProvider, RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { HttpException, Logger } from '@nestjs/common';
import { Currents } from '@wener/nestjs';
import { getServerConfig } from '@wener/nestjs/config';
import { classOf, FetchLike, getGlobalThis, MaybePromise } from '@wener/utils';
import { createFetchWithProxy } from '@wener/utils/server';
import { Elysia, t } from 'elysia';
import { inspect } from 'util';
import { HttpRequestLogEntity } from '../../entity/HttpRequestLogEntity';
import { createFetchWithCache } from '../../modules/FetchCache';
import { loadEnvs } from '../../util/loadEnvs';
import { logger } from './bun/logger';

await loadEnvs();

const log = new Logger('OpenAIProxy');
const orm = await MikroORM.init({
  discovery: {
    disableDynamicFileAccess: true,
    requireEntitiesArray: true,
  },
  clientUrl: process.env.DB_DSN || process.env.DATABASE_DSN,
  entities: [HttpRequestLogEntity],
  metadataProvider: ReflectMetadataProvider,
  resultCache: {
    adapter: MemoryCacheAdapter,
    expiration: 5000, // 5s
    options: {},
  },
  findOneOrFailHandler: (entityName, where) => {
    throw new HttpException(`未找到数据: ${entityName} ${inspect(where)}`, 404);
  },
  findExactlyOneOrFailHandler: (entityName, where) => {
    throw new HttpException(`错误的数据数量: ${entityName} ${inspect(where)}`, 400);
  },
});

let fetch: FetchLike = getGlobalThis().fetch;
fetch = createFetchWithProxy({
  fetch,
  proxy: process.env.OPENAI_PROXY || process.env.FETCH_PROXY,
});
// fetch = createFetchWith({
//   fetch,
//   onRequest: ({ next, url, req }) => {
//     return next(url, {
//       ...req,
//       proxy: process.env.FETCH_PROXY,
//     } as RequestInit);
//   },
// });
fetch = createFetchWithCache({
  fetch,
  repo: orm.em.getRepository(HttpRequestLogEntity),
  config: {
    use: 'request',
    // use: 'skip',
    expires: '5m',
  },
});

const app = new Elysia()
  .use(swagger())
  .use(logger())
  .get(
    '/ping',
    ({ body }) => {
      return { message: 'PONG', now: Math.floor(Date.now() / 1000) };
    },
    {
      response: t.Object({
        message: t.String(),
        now: t.Number(),
      }),
    },
  )
  .onParse(({ request }) => {
    return request.arrayBuffer();
  })
  .all('/v1/*', ({ headers: up, body, request: req }) => {
    const url = new URL(req.url);
    url.protocol = 'https:';
    url.host = 'api.openai.com';
    url.port = '';
    return runContext(async () => {
      let headers: Record<string, any> = {
        authorization: up.authorization,
        'content-type': up['content-type'],
        'openai-organization': up['openai-organization'],
        'x-openai-organization': up['x-openai-organization'],
      };
      // rm falsy headers
      headers = Object.fromEntries(Object.entries(headers).filter(([_, v]) => v));
      console.log(`-> ${req.method} ${url.pathname}${url.search}`, up, classOf(body));
      let res: Response;
      try {
        res = await fetch(url, {
          headers,
          body: body as any,
          method: req.method,
        });
      } catch (e) {
        console.error(`Proxy Error`, e);
        return new Response(JSON.stringify({ status: 500, message: 'proxy failed' }), {
          status: 500,
          headers: {
            'content-type': 'application/json',
          },
        });
      }
      console.log(`<- ${req.method} ${url.pathname} ${res.status} ${res.statusText}\n`, res);

      let down = {
        ...Object.fromEntries(
          Array.from(res.headers.entries()).filter(([k]) => {
            switch (k) {
              case 'content-type':
              case 'x-request-id':
                return true;
            }
            // if (k.startsWith('cf-') || k.startsWith('alt-')) {
            //   return false;
            // }
            // switch (k) {
            //   case 'set-cookie':
            //   case 'content-length':
            //     return false;
            //   default:
            //     return true;
            // }
          }),
        ),
        'cache-control': 'no-cache, must-revalidate',
      };

      return new Response(res.body, {
        status: res.status,
        headers: down,
      });
    });
  });

app.listen(getServerConfig().port, () => {
  log.log(`Listening on http://127.0.0.1:${getServerConfig().port}`);
});

export type App = typeof app;

// Bun.serve({
//   port: 3003,
//   fetch(req) {
//     const url = new URL(req.url);
//     if (url.pathname.startsWith('/v1/')) {
//       return new Response(`Processing ${url.pathname}`, {
//         status: 200,
//       });
//     }
//     return new Response(`Hello ${url.pathname}`, {
//       status: 200,
//     });
//   },
// });

function runContext<T>(f: () => MaybePromise<T>) {
  return RequestContext.createAsync(orm.em, async () => Currents.run(f));
}
