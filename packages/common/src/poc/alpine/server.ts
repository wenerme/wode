import { HttpBindings, serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { RequestContext } from '@mikro-orm/core';
import { Module } from '@nestjs/common';
import { createBootstrap, Currents, loadEnvs } from '@wener/nestjs';
import { runServer } from '@wener/nestjs/hono';
import { getEntityManager, OrmModule } from '@wener/nestjs/mikro-orm';
import { MaybePromise, parseBoolean } from '@wener/utils';
import { createYoga } from 'graphql-yoga';
import { Hono, MiddlewareHandler } from 'hono';
import { createTypeGraphSchema } from '@/poc/alpine/createTypeGraphSchema';
import { ApkIndexPkgEntity } from '@/poc/alpine/entity/ApkIndexPkgEntity';
import { ApkIndexEntity } from './entity/ApkIndexEntity';
import { ApkIndexService } from './service/ApkIndexService';

await runAlpineApiServer();

export async function runAlpineApiServer() {
  const { schema, providers } = await createTypeGraphSchema();

  type Bindings = HttpBindings & {
    /* ... */
  };
  const app = new Hono<{ Bindings: Bindings }>();

  await loadEnvs();

  @Module({
    imports: [
      OrmModule.forRoot({
        clientUrl: process.env.DB_DSN || process.env.DATABASE_DSN,
        debug: parseBoolean(process.env.DATABASE_DEBUG),
        entities: [ApkIndexEntity, ApkIndexPkgEntity],
      }),
      // OrmModule.forFeature([ApkIndexEntity, ApkIndexPkgEntity]),
    ],
    providers: [ApkIndexService, ...providers],
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

  await bootstrap();

  const yoga = createYoga({
    // schema: createGraphSchema().builder.toSchema(),
    schema: schema,
  });
  app.use('/graphql', requestContext, (c) => {
    return yoga(c.req.raw);
  });

  app.use('*', serveStatic({ root: './public' }));

  await runServer({
    app,
    port: 8787,
  });
}
