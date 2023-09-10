import type { NatsConnection } from 'nats';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Inject, Injectable, Module } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import {
  createServerLoggingMiddleware,
  ExposeMethod,
  ExposeService,
  type LocalService,
  Method,
  RemoteMethodNotImplemented,
  type ServerRequestContext,
  Service,
  ServiceRegistry,
} from '../../service';
import { ServiceClientModule } from '../../service/client/ServiceClientModule';
import { InjectNatsClient, NatsConn, NatsModule } from '../nats.module';
import { NatsServerHandler } from './NatsServerHandler';
import { NatsServiceClientConnectionModule } from './NatsServiceClientConnectionModule';
import { NatsServiceServerModule } from './NatsServiceServerModule';

process.env.NATS_URL ||= process.env.TEST_NATS_URL || 'nats://demo.nats.io:4222';

describe('nats service module', async () => {
  let svr: INestApplication;
  let client: INestApplication;

  beforeAll(async () => {
    // await polyfillServer();
    {
      const moduleRef = await Test.createTestingModule({
        imports: [ServerModule],
      }).compile();
      svr = moduleRef.createNestApplication(new FastifyAdapter());
      await svr.init();
      svr.get(ServiceRegistry).addMiddleware(createServerLoggingMiddleware());
    }
    {
      const moduleRef = await Test.createTestingModule({
        imports: [ClientModule],
      }).compile();
      client = moduleRef.createNestApplication(new FastifyAdapter());
      await client.init();
    }
  });

  test('works', async () => {
    await svr.get(NatsServerHandler).started;
    const rts = client.get(RemoteTestService);
    const res = await rts.hello({ name: 'Wener' });
    expect(res).toBe('Hello Wener');
  });

  afterAll(async () => {
    await svr?.close();
    await client?.close();
  });
});

@Service({
  name: 'wener.test.TestService',
})
abstract class AbstractTestService {
  @Method()
  hello(opts: { name: string }): string {
    throw new RemoteMethodNotImplemented();
  }
}

class RemoteTestService extends AbstractTestService {}

type LocalTestService = LocalService<AbstractTestService>;

@ExposeService({
  as: AbstractTestService,
})
class TestServiceImpl implements LocalTestService {
  constructor() {
    console.log(`Init TestServiceImpl`);
  }

  @ExposeMethod()
  async hello(a: { name: string }, opts: ServerRequestContext) {
    return `Hello ${a.name}`;
  }
}

@Injectable()
class TestService {
  constructor(
    @InjectNatsClient() readonly nats: NatsConnection,
    @Inject(NatsConn) readonly nats2: NatsConn,
  ) {
    console.log(`Init TestService`);
  }
}

@Module({
  imports: [NatsModule.forRoot(), NatsServiceServerModule.forRoot()],
  providers: [TestServiceImpl],
  exports: [TestServiceImpl],
})
class ServerModule {}

@Module({
  imports: [
    NatsModule.forRoot(),
    ServiceClientModule.forRoot({
      imports: [NatsServiceClientConnectionModule],
    }),
    ServiceClientModule.forFeature([RemoteTestService]),
  ],
  providers: [TestService],
  exports: [TestService],
})
class ClientModule {}
