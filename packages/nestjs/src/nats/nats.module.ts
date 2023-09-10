import type { ConnectionOptions, NatsConnection } from 'nats';
import type { DynamicModule, Type } from '@nestjs/common';
import { Inject, Logger, Module } from '@nestjs/common';
import { getNatsOptions } from '../config';
import { connect as defaultConnect } from './connect';

export const NATS_CONNECTION = Symbol.for('NATS_CONNECTION');

export const InjectNatsClient = () => Inject(NATS_CONNECTION);

// @ts-ignore not works as expected
export abstract class NatsConn implements NatsConnection {}

// export const NatsConn = NatsConnToken as Type<NatsConnection>;
// export type NatsConn = Type<NatsConnection>;
// export const NatsConn = NatsConnToken as Type<NatsConnection>;

@Module({})
export class NatsModule {
  static forRoot({
    global = true,
    connect = defaultConnect,
    options = getNatsOptions(),
  }: {
    global?: boolean;
    connect?: (opts: ConnectionOptions) => Promise<NatsConnection>;
    options?: ConnectionOptions;
  } = {}): DynamicModule {
    const mod = {
      module: NatsModule,
      exports: [NATS_CONNECTION, NatsConn],
      providers: [
        {
          provide: NatsConn,
          useExisting: NATS_CONNECTION,
        },
        {
          provide: NATS_CONNECTION,
          useFactory: async () => {
            log.log(
              `connecting: ${Array.from(options.servers ?? [])
                .flat()
                .map((v) => maskUrl(v))}`,
            );
            const client = await connect(options);
            log.log(`connected`);
            return client;
          },
        },
      ],
      global,
    };
    return mod;
  }
}

const log = new Logger(NatsModule.name);

function maskUrl(s: string) {
  if (!/^\w+:\/\//.test(s)) {
    s = 'nats://' + s;
  }
  return s.replace(/:\/\/.*@/, '://***:***@');
}
