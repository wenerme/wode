import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { App } from '@wener/nestjs/app';
import { OrmModule } from '@wener/nestjs/mikro-orm';
import { polyfillCrypto } from '@wener/utils/server';
import { FastifyInstance } from 'fastify';
import { runApplication } from '../../app/app.run';
import { HttpRequestLogEntity } from '../../entity/HttpRequestLogEntity';
import { loadEnvs } from '../../util/loadEnvs';
import { EntityEventSubscriber } from '../wener-get-server/EntityEventSubscriber';
import { ErrorFilter } from '../wener-get-server/ErrorFilter';
import { SimpleProxyController } from './SimpleProxyController';

process.env.APP_NAME ||= 'wener';
process.env.APP_COMPONENT ||= 'openai-proxy';
let debug = process.env.NODE_ENV === 'development';
const AppName = App.name;

const log = new Logger(AppName);

@Module({
  providers: [EntityEventSubscriber],
  exports: [EntityEventSubscriber],
})
class DataModule {}

await polyfillCrypto();
await loadEnvs();

// const modules = [WenerGetWebModule, AuditModule];

@Module({
  imports: [
    // FastifyMulterModule,
    // AuthModule.forRoot(),
    ConfigModule.forRoot({}),
    OrmModule.forRoot({
      entities: [HttpRequestLogEntity],
    }),

    OrmModule.forFeature([HttpRequestLogEntity]),
    // FetchCacheModule.forRoot({
    //   schema: process.env.FETCH_CACHE_SCHEMA || 'proxy',
    // }),
    // ProxyModule,
  ],
  controllers: [SimpleProxyController],
  providers: [],
})
export class AppModule {}

const app = await runApplication({
  name: AppName,
  module: AppModule,
  openapi: (builder) => {
    builder.addApiKey(
      {
        type: 'apiKey',
        name: 'X-Token',
      },
      'X-Token',
    );
  },
  onAfterBootstrap: (app) => {
    const httpAdapterHost = app.get(HttpAdapterHost);
    const fastify: FastifyInstance = httpAdapterHost.httpAdapter.getInstance();
    // preserve
    fastify.addContentTypeParser(
      ['application/xml', 'text/xml', 'multipart/form-data'],
      { parseAs: 'string' },
      (req, body, done) => {
        console.log('parseAs string', body);
        done(null, body);
      },
    );
    app.useGlobalFilters(new ErrorFilter(httpAdapterHost));
    patchNestjsSwagger();
  },
});

// HttpAdapterHost<FastifyAdapter>
// const fastify = app.getHttpAdapter().getInstance();

//
// if (fastify.hasContentTypeParser('multipart')) {
//   log.log('has multipart parser');
// }
