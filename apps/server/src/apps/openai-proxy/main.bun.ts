import { inspect } from 'node:util';
import { swagger } from '@elysiajs/swagger';
import { MemoryCacheAdapter, ReflectMetadataProvider, RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { HttpException, Logger, Module } from '@nestjs/common';
import { createBootstrap, Currents } from '@wener/nestjs';
import { getServerConfig } from '@wener/nestjs/config';
import { OrmModule } from '@wener/nestjs/mikro-orm';
import { Errors, FetchLike, getGlobalThis, MaybePromise, parseBoolean } from '@wener/utils';
import { createFetchWithProxy } from '@wener/utils/server';
import { Elysia, t } from 'elysia';
import { AccessTokenEntity } from '../../entity/AccessTokenEntity';
import { ClientAgentEntity } from '../../entity/ClientAgentEntity';
import { HttpRequestLogEntity } from '../../entity/HttpRequestLogEntity';
import { createFetchWithCache } from '../../modules/FetchCache';
import { loadEnvs } from '../../util/loadEnvs';
import { EntityEventSubscriber } from '../wener-get-server/EntityEventSubscriber';
import { logger } from './bun/logger';
import { proxyOpenAi } from './proxyOpenAi';
import { resolveServerError } from './resolveErrorDetail';

await loadEnvs();

Errors.resolvers.push(resolveServerError);

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

// https://github.com/oven-sh/bun/issues?q=is%3Aissue+is%3Aopen+Segmentation+fault
// Segmentation fault: 11
@Module({
  imports: [
    OrmModule.forRoot({
      clientUrl: process.env.DB_DSN || process.env.DATABASE_DSN,
      debug: parseBoolean(process.env.DATABASE_DEBUG),
      entities: [HttpRequestLogEntity, ClientAgentEntity, AccessTokenEntity],
    }),
  ],
})
export class AppModule {}

const bootstrap = createBootstrap({
  module: AppModule,
});

let proxyFetch: FetchLike = getGlobalThis().fetch;
proxyFetch = createFetchWithProxy({
  fetch: proxyFetch,
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
proxyFetch = createFetchWithCache({
  fetch: proxyFetch,
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
  .onParse(({ request }, type) => {
    // POST form not works WHY ?
    // ReadableStream
    // return request.body;

    // Works but don't have to
    // if (type === 'multipart/form-data') {
    //   return request.formData();
    // }
    return request.arrayBuffer();
  })
  .onError(({ error, request: req }) => {
    console.error(`Handle Error ${req.method} ${req.url} :`, error);
    return Errors.resolve(error).asResponse();
  })
  .all('/v1/*', ({ headers, body, request }) => {
    // curl POST > 1024
    // -H 'Expect:'
    // https://everything.curl.dev/http/post/expect100
    // https://gms.tf/when-curl-sends-100-continue.html
    if (headers.expect === '100-continue') {
    }
    return proxyOpenAi({ headers, body, request, debug: isDev, fetch: proxyFetch });
  });

{
  // https://github.com/elysiajs/elysia/issues/315
  app.onStart(({ app }) => {
    app.server?.reload({
      fetch: async (req) => {
        console.log(`Hook by Reload`);
        return runContext(() => app.fetch(req));
      },
    });
  });
}

app.listen(getServerConfig().port, (server) => {
  log.log(`Listening on ${server.url}`);
});

export type App = typeof app;

function runContext<T>(f: () => MaybePromise<T>) {
  // return bootstrap().then(() => RequestContext.createAsync(orm.em, async () => Currents.run(f)));
  return RequestContext.createAsync(orm.em, async () => Currents.run(f));
}
