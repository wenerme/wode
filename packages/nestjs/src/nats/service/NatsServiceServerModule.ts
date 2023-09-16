import type { DynamicModule, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Inject, Injectable, Module } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { arrayOfMaybeArray } from '@wener/utils';
import type { ServerMiddleware } from '../../service/server/ServiceRegistry';
import { ServiceServerModule } from '../../service/server/ServiceServerModule';
import { NatsServerHandler } from './NatsServerHandler';
import { NatsServerRegistry } from './NatsServerRegistry';

export interface NatsServiceServerOptions {
  getServiceSubject?: (o: { name: string }) => string[];
  middlewares?: ServerMiddleware[];
}

export const NATS_SERVICE_SERVER_MIDDLEWARE = Symbol('NATS_SERVICE_SERVER_MIDDLEWARE');
export const NATS_SERVICE_SERVER_OPTIONS = Symbol('NATS_SERVICE_SERVER_OPTIONS');

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

            o.middlewares.push(...arrayOfMaybeArray(_mw));
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
