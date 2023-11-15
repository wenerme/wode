import { swagger } from '@elysiajs/swagger';
import { MemoryCacheAdapter, ReflectMetadataProvider, RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { HttpException, Logger } from '@nestjs/common';
import { Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { Currents } from '@wener/nestjs';
import { getServerConfig } from '@wener/nestjs/config';
import { Errors, FetchLike, getGlobalThis, isUUID, MaybePromise, parseBoolean } from '@wener/utils';
import { createFetchWithProxy } from '@wener/utils/server';
import { Elysia, t } from 'elysia';
import { inspect } from 'util';
import { getEntityManager } from '../../app/mikro-orm';
import { AccessTokenEntity } from '../../entity/AccessTokenEntity';
import { ClientAgentEntity } from '../../entity/ClientAgentEntity';
import { HttpRequestLogEntity } from '../../entity/HttpRequestLogEntity';
import { createFetchWithCache } from '../../modules/FetchCache';
import { loadEnvs } from '../../util/loadEnvs';
import { EntityEventSubscriber } from '../wener-get-server/EntityEventSubscriber';
import { logger } from './bun/logger';
import { parseAuthorization } from './parseAuthorization';

await loadEnvs();

const log = new Logger('OpenAIProxy');
const orm = await MikroORM.init({
  discovery: {
    disableDynamicFileAccess: true,
    requireEntitiesArray: true,
  },
  clientUrl: process.env.DB_DSN || process.env.DATABASE_DSN,
  debug: parseBoolean(process.env.DATABASE_DEBUG),
  entities: [HttpRequestLogEntity, ClientAgentEntity, AccessTokenEntity],
  subscribers: [new EntityEventSubscriber()],
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

const isDev = process.env.NODE_ENV === 'development';

const app = new Elysia()
  .use(swagger())
  .use(logger())
  .get('/healthz', () => {
    return 'OK';
  })
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
      let authorization = up.authorization;
      let isSecretKey = false;
      let headers: Record<string, any> = {
        authorization: authorization,
        'content-type': up['content-type'],
        'openai-organization': up['openai-organization'],
      };
      {
        let [type, token] = parseAuthorization(authorization);
        switch (type?.toLowerCase()) {
          case 'bearer':
            if (token && (isUUID(token) || (token?.startsWith('sk-') && isUUID(token?.substring(3))))) {
              // allow sk- prefix
              // some client will detect sk-
              if (token.startsWith('sk-')) {
                token = token.slice(3);
              }
              let repo = getEntityManager().getRepository(AccessTokenEntity);
              let at = await repo.findOne(
                {
                  $and: [
                    {
                      accessToken: token,
                      clientAgent: {
                        type: 'OpenAi',
                        active: true,
                      },
                    },
                    {
                      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
                    },
                  ],
                },
                {
                  populate: ['clientAgent'],
                  cache: 1000 * 60,
                },
              );
              let ca = at?.clientAgent;
              if (!at || !ca) {
                return Errors.Unauthorized.with('Invalid Token').asResponse();
              }
              if (!Value.Check(OpenAiClientAgent, ca)) {
                return Errors.BadRequest.with('Invalid Client Agent').asResponse();
              }

              headers.authorization = `Bearer ${ca.secrets.key}`;
              headers['openai-organization'] ||= ca.secrets.organization;
            } else if (token?.startsWith('sk-')) {
              isSecretKey = true;
            }
        }
      }

      // rm falsy headers
      headers = Object.fromEntries(Object.entries(headers).filter(([_, v]) => v));
      if (isDev) {
        console.log(`-> ${req.method} ${url.pathname}${url.search}`, up);
      }
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

      if (isDev) {
        console.log(`<- ${req.method} ${url.pathname} ${res.status} ${res.statusText}`);
      }

      let down = {
        ...Object.fromEntries(
          Array.from(res.headers.entries()).filter(([k]) => {
            switch (k) {
              case 'content-type':
              case 'x-request-id':
                return true;
            }

            if (isSecretKey) {
              if (k.startsWith('openai-') || k.startsWith('x-ratelimit-')) {
                return true;
              }
            }
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

export type OpenAiClientAgent = Static<typeof OpenAiClientAgent>;
export const OpenAiClientAgent = t.Object({
  type: t.Literal('OpenAi'),
  secrets: t.Object({
    key: t.String(),
    organization: t.Optional(t.String()),
    endpoint: t.Optional(t.String()),
  }),
  config: t.Object({
    defaults: t.Optional(t.Record(t.String(), t.Record(t.String(), t.Any()))),
    overrides: t.Optional(t.Record(t.String(), t.Record(t.String(), t.Any()))),
  }),
});
