import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import type { NatsConnection } from 'nats';
import { NATS_CONNECTION, NatsModule } from '..';
import { type ServerRequest, SERVICE_CLIENT_CONNECTION } from '../../service';
import { createNatsClientConnection } from './createNatsClientConnection';

export interface NatsServiceClientConnectionOptions {
  getSubject?: (req: ServerRequest) => string;
}

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<NatsServiceClientConnectionOptions>().build();

export const NATS_SERVICE_CLIENT_CONNECTION = Symbol('NATS_SERVICE_CLIENT_CONNECTION');

@Module({
  imports: [NatsModule],
  providers: [
    {
      provide: NATS_SERVICE_CLIENT_CONNECTION,
      useFactory(nc: NatsConnection, { getSubject }: NatsServiceClientConnectionOptions = {}) {
        return createNatsClientConnection({ nc, getSubject });
      },
      inject: [NATS_CONNECTION, { token: MODULE_OPTIONS_TOKEN, optional: true }],
    },
    {
      provide: SERVICE_CLIENT_CONNECTION,
      useExisting: NATS_SERVICE_CLIENT_CONNECTION,
    },
  ],
  exports: [SERVICE_CLIENT_CONNECTION, NATS_SERVICE_CLIENT_CONNECTION],
})
export class NatsServiceClientConnectionModule extends ConfigurableModuleClass {}
