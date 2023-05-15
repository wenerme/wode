import fastifyCookie from '@fastify/cookie';
import { CacheModule } from '@nestjs/cache-manager';
import { Controller, Get, Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { randomUUID } from '@wener/utils';
import { polyfillCrypto } from '@wener/utils/server';
import { runApplication } from '../../app/app.run';
import { AuthModule } from '../../app/auth/auth.module';
import { CoreModule } from '../../app/core.module';
import { ModuleLoader } from '../../app/loader.module';
import { FetchCacheModule, HttpRequestLog } from '../../modules/fetch-cache';
import { getServerUrl } from './getServerUrl';
import { HashController } from './hash/hash.controller';
import { IpController } from './http/ip.controller';
import { WhoamiController } from './http/whoami.controller';
import { GenerateController } from './password/generate.controller';
import { ZxcvbnController } from './password/zxcvbn.controller';
import { RootResolver } from './root.resolver';
import { SemverController } from './semver/semver.controller';

const AppName = 'apis-open-server';

@Controller('.well-known')
class WellKnownController {
  @Get('server.json')
  server() {
    return {
      name: AppName,
      baseUrl: getServerUrl(),
    };
  }
}

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 30,
    }),
    FetchCacheModule.forRoot({
      schema: 'cache',
    }),
    AuthModule,
    CoreModule.forRoot({
      name: AppName,
      db: {
        entities: [HttpRequestLog],
      },
    }),
    ModuleLoader.forRoot({
      // modules: ['npm', 'github', 'hn', 'alpine', 'qr'],
      modules: [
        import('./modules/npm/module'),
        import('./modules/github/module'),
        import('./modules/hn/module'),
        import('./modules/alpine/module'),
        import('./modules/qr/module'),
      ],
      // vite-plugin-dynamic-import
      // @rollup/plugin-dynamic-import-vars
      // https://github.com/RtVision/esbuild-dynamic-import
      loader: (name) => import(`./modules/${name}/module`),
    }),
  ],

  controllers: [
    HashController,
    GenerateController,
    ZxcvbnController,
    SemverController,
    WhoamiController,
    IpController,
    WellKnownController,
  ],
  providers: [
    RootResolver,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
class ApisServerModule {}

await polyfillCrypto();
await runApplication({
  name: AppName,
  module: ApisServerModule,
  onAfterBootstrap: async (app) => {
    app.useGlobalPipes(new ValidationPipe());
    await app.register(fastifyCookie, {
      secret: process.env.COOKIE_SECRET || randomUUID(),
    });
  },
});
