/** @jsx jsx */

/** @jsxFrag Fragment */
import { serve } from '@hono/node-server';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { RequestContext } from '@mikro-orm/core';
import { Module } from '@nestjs/common';
import { createBootstrap, Currents } from '@wener/nestjs';
import { getEntityManager, OrmModule } from '@wener/nestjs/mikro-orm';
import { FetchLike, getGlobalThis, MaybePromise, parseBoolean } from '@wener/utils';
import { createFetchWithProxy } from '@wener/utils/src/servers/fetch/createFetchWithProxy';
import dotenv from 'dotenv';
import { showRoutes } from 'hono/dev';
import { jsx } from 'hono/jsx';
import { AccessTokenEntity } from '../../entity/AccessTokenEntity';
import { ClientAgentEntity } from '../../entity/ClientAgentEntity';
import { HttpRequestLogEntity } from '../../entity/HttpRequestLogEntity';
import { createFetchWithCache } from '../../modules/FetchCache';
import { loadEnvs } from '../../util/loadEnvs';
import { proxyOpenAi } from './proxyOpenAi';

await loadEnvs();
const isDev = process.env.NODE_ENV === 'development';

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
  onBootstrap: () => {
    console.log(`[AppModule] bootstrap`);
  },
});

function runContext<T>(f: () => MaybePromise<T>) {
  return bootstrap().then(() => RequestContext.create(getEntityManager(), async () => Currents.run(f)));
  // return RequestContext.createAsync(orm.em, async () => Currents.run(f));
}

const PingRequestParamsSchema = z.object({
  component: z.string().optional(),
});
const PingResponseSchema = z.object({
  message: z.string(),
  ok: z.boolean(),
  now: z.number(),
});

let serveStatic;

if (typeof Bun !== 'undefined') {
  ({ serveStatic } = await import('hono/bun'));
} else {
  ({ serveStatic } = await import('@hono/node-server/serve-static'));
}

function getProxyFetch() {
  let proxyFetch: FetchLike = getGlobalThis().fetch;
  proxyFetch = createFetchWithProxy({
    fetch: proxyFetch,
    proxy: process.env.OPENAI_PROXY || process.env.FETCH_PROXY,
  });
  proxyFetch = createFetchWithCache({
    fetch: proxyFetch,
    repo: getEntityManager().getRepository(HttpRequestLogEntity) as any,
    config: {
      use: 'request',
      // use: 'skip',
      expires: '5m',
    },
  });
  return proxyFetch;
}
const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          errors: String(result),
          source: 'custom_error_handler',
        },
        422,
      );
    }
  },
});

app.use('*', (c, next) => {
  return runContext(() => next());
});
app.openapi(
  createRoute({
    method: 'get',
    path: '/ping',
    request: {
      params: PingRequestParamsSchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: PingResponseSchema,
          },
        },
        description: 'PING',
      },
    },
  }),
  (c) => {
    const { component } = c.req.valid('param');
    return c.json({
      message: `${component || 'PONG'}`,
      now: Math.floor(Date.now() / 1000),
      ok: true,
    });
  },
);

app.all('/v1/*', (c) => {
  // curl POST > 1024
  // -H 'Expect:'
  // https://everything.curl.dev/http/post/expect100
  // https://gms.tf/when-curl-sends-100-continue.html
  const request = c.req.raw;
  let headers = Object.fromEntries(request.headers.entries());
  let body = request.body;
  if (headers.expect === '100-continue') {
  }
  return proxyOpenAi({ headers, body, request, debug: isDev, fetch: getProxyFetch() });
});

const View = () => {
  return (
    <html>
      <body>
        <h1>Hello Hono!</h1>
      </body>
    </html>
  );
};

app.get('/page', (c) => {
  return c.html(<View />);
});
app.get('/', (c) => c.text('Hello'));
app.use('*', serveStatic({ root: './public' }));
app.notFound((c) => c.redirect('https://wener.me'));

// assume docs.html exists, just expose doc
app.doc('/api-json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'API',
  },
});

showRoutes(app);

let port = parseInt(process.env.PORT || '0') || 3000;

if (typeof Bun !== 'undefined') {
} else {
  serve(
    {
      port: port,
      fetch: app.fetch,
    },
    (info) => {
      console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
    },
  );
}

export default {
  port,
  fetch: app.fetch,
};
