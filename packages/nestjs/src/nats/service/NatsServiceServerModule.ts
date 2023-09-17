import type { DynamicModule, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Inject, Module } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import type { ServerMiddleware } from '../../service';
import { ServiceServerModule } from '../../service';
import { NatsServerHandler } from './NatsServerHandler';
import { NatsServerRegistry } from './NatsServerRegistry';
import { NATS_SERVICE_SERVER_MIDDLEWARE, NATS_SERVICE_SERVER_OPTIONS } from './const';
import { NatsServiceServerOptions } from './types';

@Module({})
export class NatsServiceServerModule implements OnApplicationBootstrap, OnApplicationShutdown {
  static forRoot({
    options = {},
  }: {
    options?: NatsServiceServerOptions;
  } = {}): DynamicModule {
    return {
      module: NatsServiceServerModule,
      imports: [ServiceServerModule],
      providers: [
        NatsServerHandler,
        NatsServerRegistry,
        {
          provide: NATS_SERVICE_SERVER_MIDDLEWARE,
          useValue: [],
        },
        {
          provide: NATS_SERVICE_SERVER_OPTIONS,
          useFactory(mc: ModulesContainer, _mw: ServerMiddleware[] | ServerMiddleware) {
            const o = {
              middlewares: [],
              ...options,
            };

            // o.middlewares.push(...arrayOfMaybeArray(_mw));
            return o;
          },
          inject: [ModulesContainer, NATS_SERVICE_SERVER_MIDDLEWARE],
        },
      ],
      exports: [NatsServerRegistry],
    };
  }

  @Inject(NatsServerHandler) private readonly hdr!: NatsServerHandler;

  constructor() {}

  async onApplicationShutdown() {
    return this.hdr.close();
  }

  onApplicationBootstrap(): any {
    this.hdr.listen();
  }
}
