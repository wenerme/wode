import type { NatsConnection } from 'nats';
import { Module } from '@nestjs/common';
import { NATS_CONNECTION, NatsModule } from '..';
import { SERVICE_CLIENT_CONNECTION } from '../../service';
import { createNatsClientConnection } from './createNatsClientConnection';

const NATS_SERVICE_CLIENT_CONNECTION = Symbol('NATS_SERVICE_CLIENT_CONNECTION');

@Module({
  imports: [NatsModule],
  providers: [
    {
      provide: NATS_SERVICE_CLIENT_CONNECTION,
      useFactory(nc: NatsConnection) {
        return createNatsClientConnection({ nc });
      },
      inject: [NATS_CONNECTION],
    },
    {
      provide: SERVICE_CLIENT_CONNECTION,
      useExisting: NATS_SERVICE_CLIENT_CONNECTION,
    },
  ],
  exports: [SERVICE_CLIENT_CONNECTION],
})
export class NatsServiceClientConnectionModule {}
