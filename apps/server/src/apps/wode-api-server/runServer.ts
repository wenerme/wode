import os from 'node:os';
import process from 'node:process';
import { serveStatic } from '@hono/node-server/serve-static';
import { DataloaderType, MemoryCacheAdapter } from '@mikro-orm/core';
import { defineConfig, type EntityManager } from '@mikro-orm/postgresql';
import { Logger, Module } from '@nestjs/common';
import {
  createArgon2PasswordAlgorithm,
  createBase64PasswordAlgorithm,
  createBcryptPasswordAlgorithm,
  Password,
} from '@wener/common/password';
import { createBootstrap } from '@wener/nestjs';
import { createOpenAPIHono, runServer } from '@wener/nestjs/hono';
import { getEntityManager, OrmModule } from '@wener/nestjs/mikro-orm';
import { parseBoolean } from '@wener/utils';
import { GraphQLSchema } from 'graphql/type';
import { cors } from 'hono/cors';
import { isDev } from '@/const';
import { withHonoAuth } from '@/server/hono/withHonoAuth';
import { withHonoContext } from '@/server/hono/withHonoContext';
import { resolveProxyExternalUrl } from '@/server/proxy/resolveProxyExternalUrl';
import { serveExternalProxy } from '@/server/proxy/serveExternalProxy';
import { createBaseRoute } from '@/server/routes/createBaseRoute';
import { buildGraphQLSchema, ContextGraphAuthChecker } from '@/server/yoga/buildGraphQLSchema';
import { createYogaServer } from '@/server/yoga/createYogaServer';
import { serveYoga } from '@/server/yoga/serveYoga';
import { getInstanceGraphModule } from './getInstanceGraphModule';
import { setupDayjs } from './setupDayjs';

setupDayjs();

const Instance = getInstanceGraphModule();

export async function runDemoApiServer() {
  const bootstrap = createBootstrap({
    module: ApiServerModule,
  });

  await bootstrap();

  let app = createOpenAPIHono();
  let log = new Logger(runDemoApiServer.name);
  const withContext = withHonoContext();
  const withAuth = withHonoAuth({ log });

  if (isDev()) {
    const em = getEntityManager<EntityManager>();
    let knex = em.getKnex();
    const {
      current_user: currentUser,
      version: version,
      current_catalog: database,
    } = (await knex.raw('select current_user, current_catalog, version()')).rows[0];
    const searchPath = (await knex.raw('show search_path')).rows[0].search_path;
    log.debug(`DB Conn: ${version} db=${database} current_user=${currentUser}, search_path=${searchPath}`);
  }

  Password.addAlgorithm(createBcryptPasswordAlgorithm());
  Password.addAlgorithm(
    createArgon2PasswordAlgorithm({
      provide: () => import('argon2'),
    }),
  );
  Password.setDefaultAlgorithm('argon2i');

  if (isDev()) {
    Password.addAlgorithm(createBase64PasswordAlgorithm());
  }

  {
    const yoga = createYogaServer();

    app.on(
      ['POST', 'GET', 'OPTIONS'],
      '/graphql/*',
      cors({
        origin: '*',
        allowMethods: ['POST', 'GET', 'OPTIONS'],
        allowHeaders: ['content-type', 'authorization'],
        credentials: true,
      }),
      withContext,
      withAuth,
      serveYoga({ yoga, sseEndpoint: '/graphql/stream' }),
    );
  }

  app.on(['GET', 'HEAD', 'OPTIONS'], ['/proxy/:target{.+}'], async (c) => {
    const target = c.req.param('target');
    return serveExternalProxy({
      context: c,
      target: resolveProxyExternalUrl(target)?.url,
      log,
      cacheDir: getFileCacheDir(),
    });
  });
  app.route('/', createBaseRoute());
  app.use('*', serveStatic({ root: './public' }));

  await runServer({
    app,
    env: false,
  });
}

function getTempDir() {
  // Windows: TEMP, TMP, %SystemRoot%\temp, %windir%\temp
  // TMPDIR, TMP, TEMP, /tmp
  return os.platform() === 'darwin' ? '/tmp' : os.tmpdir();
}

function getFileCacheDir() {
  return `${getTempDir()}/file/cache`;
}

@Module({
  imports: [
    OrmModule.forRootAsync({
      useFactory: () => {
        return defineConfig({
          clientUrl: process.env.DATABASE_URL || process.env.DATABASE_DSN || process.env.DB_URL || process.env.DB_DSN,
          entities: [...Instance.entities],
          dataloader: DataloaderType.ALL,
          // debug: isDev,
          debug: parseBoolean(process.env.DB_DEBUG),
          resultCache: {
            adapter: MemoryCacheAdapter,
            expiration: 1000, // 1s
            global: 50,
            options: {},
          },
        });
      },
    }),
    Instance.module,
  ],
  providers: [
    ContextGraphAuthChecker,
    {
      provide: GraphQLSchema,
      useFactory: async () => {
        return buildGraphQLSchema({
          resolvers: Instance.resolvers,
        });
      },
    },
  ],
  exports: [],
})
class ApiServerModule {}
