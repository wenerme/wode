import process from 'node:process';
import { Inject, Injectable, Module, type INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createServerLoggingMiddleware,
  ExposeMethod,
  ExposeService,
  Method,
  RemoteMethodNotImplemented,
  Service,
  ServiceClientModule,
  ServiceRegistry,
  type LocalService,
  type ServerRequestOptions,
} from '../../service';
import { InjectNatsClient, NatsConn, NatsModule } from '../NatsModule';
import { NatsServerHandler } from './NatsServerHandler';
import { NatsServiceClientModule } from './NatsServiceClientModule';
import { NatsServiceServerModule } from './NatsServiceServerModule';

process.env.NATS_URL ||= process.env.TEST_NATS_URL || 'nats://demo.nats.io:4222';

const triggers = {
  server: 0,
  client: 0,
};
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
    expect(triggers.client).toBe(1);
    expect(triggers.server).toBe(1);
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
  hello(_opts: { name: string }): string {
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
    console.log('Init TestServiceImpl');
  }

  @ExposeMethod()
  async hello(a: { name: string }, _opts: ServerRequestOptions) {
    return `Hello ${a.name}`;
  }
}

@Injectable()
class TestService {
  constructor(
    @InjectNatsClient() readonly nats: NatsConn,
    @Inject(NatsConn) readonly nats2: NatsConn,
  ) {
    console.log('Init TestService');
  }
}

@Module({
  imports: [
    NatsModule.forRoot({}),
    NatsServiceServerModule.forRoot({
      middlewares: [
        (next) => {
          return (req) => {
            triggers.server++;
            return next(req);
          };
        },
      ],
    }),
  ],
  providers: [TestServiceImpl],
  exports: [TestServiceImpl],
})
class ServerModule {}

@Module({
  imports: [
    NatsModule.forRoot({}),
    NatsServiceClientModule.forRoot({
      middlewares: [
        (next) => {
          return (req) => {
            triggers.client++;
            return next(req);
          };
        },
      ],
    }),
    ServiceClientModule.forFeature([RemoteTestService]),
  ],
  providers: [TestService],
  exports: [TestService],
})
class ClientModule {}
