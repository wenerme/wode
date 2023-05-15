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
import { FetchCacheModule, HttpRequestLog } from '../../modules/fetch-cache';
import { AlpineModule } from './alpine/alpine.module';
import { getServerUrl } from './getServerUrl';
import { GithubModule } from './github/github.module';
import { HashController } from './hash/hash.controller';
import { HackerNewsModule } from './hn/hacker-news.module';
import { IpController } from './http/ip.controller';
import { WhoamiController } from './http/whoami.controller';
import { NpmModule } from './npm/npm.module';
import { PackageMeta } from './npm/registry/entity/PackageMeta';
import { GenerateController } from './password/generate.controller';
import { ZxcvbnController } from './password/zxcvbn.controller';
import { QrModule } from './qr/qr.module';
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
        entities: [HttpRequestLog, PackageMeta],
      },
    }),
    GithubModule,
    AlpineModule,
    QrModule,
    HackerNewsModule,
    NpmModule,
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
