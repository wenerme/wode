import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { NatsConnection } from 'nats';
import { ClientConnection, ClientMiddleware, ServerRequest, ServiceClientModule } from '../../service';
import { SERVICE_CLIENT_MODULE_OPTIONS } from '../../service/client/ServiceClientModule';
import { NATS_CONNECTION, NatsModule } from '../nats.module';
import { createNatsClientConnection } from './createNatsClientConnection';

export interface NatsServiceClientModuleOptions {
  getSubject?: (req: ServerRequest) => string;
  middlewares?: ClientMiddleware[];
}

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<NatsServiceClientModuleOptions>()
    .setExtras(
      {
        isGlobal: true,
      },
      (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
      }),
    )
    .setClassMethodName('forRoot')
    .build();

const NATS_SERVICE_CLIENT_CONNECTION = Symbol('NATS_SERVICE_CLIENT_CONNECTION');

@Module({
  imports: [NatsModule, ServiceClientModule],
  providers: [
    {
      provide: NATS_SERVICE_CLIENT_CONNECTION,
      useFactory(nc: NatsConnection, { getSubject }: NatsServiceClientModuleOptions = {}) {
        return createNatsClientConnection({ nc, getSubject });
      },
      inject: [NATS_CONNECTION, { token: MODULE_OPTIONS_TOKEN, optional: true }],
    },
    {
      provide: SERVICE_CLIENT_MODULE_OPTIONS,
      useFactory(conn: ClientConnection, { middlewares = [] }: NatsServiceClientModuleOptions = {}) {
        return { connection: conn, middlewares };
      },
      inject: [NATS_SERVICE_CLIENT_CONNECTION, { token: MODULE_OPTIONS_TOKEN, optional: true }],
    },
  ],
  exports: [ServiceClientModule, SERVICE_CLIENT_MODULE_OPTIONS],
})
export class NatsServiceClientModule extends ConfigurableModuleClass {}
