import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { Module, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrmModule } from '@wener/nestjs/mikro-orm';
import { polyfillCrypto } from '@wener/utils/server';
import { FastifyInstance } from 'fastify';
import { ActuatorModule } from '../../app/actuator/actuator.module';
import { databaseConfig } from '../../app/config/database.config';
import { redisConfig } from '../../app/config/redis.config';
import { serverConfig } from '../../app/config/server.config';
import { runApplication } from '../../app/run';
import { loadEnvs } from '../../util/loadEnvs';
import { EntityEventSubscriber } from './EntityEventSubscriber';
import { EntityType } from './EntityType';
import { ErrorFilter } from './ErrorFilter';
import { WenerGetWebModule } from './WenerGetWebModule';

process.env.APP_NAME = 'wener';
process.env.APP_COMPONENT = 'get-server';
let debug = process.env.NODE_ENV === 'development';

@Module({
  providers: [EntityEventSubscriber],
  exports: [EntityEventSubscriber],
})
class DataModule {}

await polyfillCrypto();
await loadEnvs();

const modules = [WenerGetWebModule];

@Module({
  controllers: [],
  imports: [
    // ServeStaticModule.forRoot({
    //   renderPath: '/static',
    //   rootPath: getStaticRootPath(),
    // }),
    DataModule,
    ActuatorModule,
    EventEmitterModule.forRoot(),
    OrmModule.forRootAsync({
      imports: [DataModule],
      inject: [EntityEventSubscriber],
      useFactory: (sub: EntityEventSubscriber) => {
        if (!sub) {
          throw new Error();
        }
        return {
          debug,
          subscribers: [sub],
          entities: [
            ...modules.flatMap((v) => {
              return (
                (
                  v as {
                    Entities?: EntityType[];
                  }
                ).Entities ?? []
              );
            }),
          ],
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serverConfig, databaseConfig, redisConfig],
      cache: true,
    }),
    ...modules,
  ],

  providers: [],
})
class AppServerModule {}

await runApplication({
  module: AppServerModule,
  openapi(builder) {
    builder.addBearerAuth();
  },
  onAfterBootstrap(app) {
    app.enableVersioning({
      type: VersioningType.URI,
    });
    const httpAdapterHost = app.get(HttpAdapterHost);
    const fastify: FastifyInstance = httpAdapterHost.httpAdapter.getInstance();
    fastify.addContentTypeParser(['application/xml', 'text/xml'], { parseAs: 'string' }, (req, body, done) => {
      done(null, body);
    });
    app.useGlobalFilters(new ErrorFilter(httpAdapterHost));
    patchNestjsSwagger();
  },
});
