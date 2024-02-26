import { HttpBindings, serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { RequestContext } from '@mikro-orm/core';
import { Module } from '@nestjs/common';
import { createBootstrap, Currents } from '@wener/nestjs';
import { loadEnvs } from '@wener/nestjs';
import { getEntityManager, OrmModule } from '@wener/nestjs/mikro-orm';
import { MaybePromise, parseBoolean } from '@wener/utils';
import { createYoga } from 'graphql-yoga';
import { Hono, MiddlewareHandler } from 'hono';
import { showRoutes } from 'hono/dev';
import { createGraphSchema } from './createGraphSchema';
import { ApkIndexEntity, ApkIndexPkgEntity } from './entity/ApkIndexEntity';
import { ApkIndexService } from './service/ApkIndexService';

const yoga = createYoga({
  schema: createGraphSchema().builder.toSchema(),
});

type Bindings = HttpBindings & {
  /* ... */
};
export const app = new Hono<{ Bindings: Bindings }>();

await loadEnvs();

@Module({
  imports: [
    OrmModule.forRoot({
      clientUrl: process.env.DB_DSN || process.env.DATABASE_DSN,
      debug: parseBoolean(process.env.DATABASE_DEBUG),
      entities: [ApkIndexEntity, ApkIndexPkgEntity],
    }),
  ],
  providers: [ApkIndexService],
})
class AppModule {}

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

const requestContext: MiddlewareHandler = (c, next) => {
  return runContext(next);
};

app.use('/graphql', requestContext, (c) => {
  return yoga(c.req.raw);
});

app.use('*', serveStatic({ root: './public' }));

await bootstrap();
serve(
  {
    fetch: app.fetch,
    port: 8787,
  },
  ({ port, address }) => {
    showRoutes(app);
    console.log(`Listening on http://${address}:${port}`); // Listening on http://localhost:3000
  },
);
