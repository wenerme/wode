import { NatsConnection } from 'nats';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Inject, Injectable, Module } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { InjectNatsClient, NatsConn, NatsModule } from './nats.module';

process.env.NATS_URL ||= process.env.TEST_NATS_URL || 'nats://demo.nats.io:4222';
describe('nats module', async () => {
  let app: INestApplication;
  beforeAll(async () => {
    // await polyfillServer();
    const moduleRef = await Test.createTestingModule({
      imports: [DemoModule],
    }).compile();
    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
  });

  test('works', async () => {
    const service = app.get(TestService);
    expect(service.nats).toBe(service.nats2);
    const sub = service.nats.subscribe('wener.test', {
      queue: 'wener',
    });
    Promise.resolve().then(async () => {
      for await (const m of sub) {
        console.log(`Got message ${m.subject}: ${JSON.stringify(m.json())}`);
        m.respond(JSON.stringify({ NAME: 'OK' }));
      }
    });
    const res = await service.nats.request('wener.test', JSON.stringify({ r: 'YES' }));
    expect(res.json()).toEqual({ NAME: 'OK' });
  });

  afterAll(async () => {
    await app?.close();
  });
});

@Injectable()
class TestService {
  constructor(
    @InjectNatsClient() readonly nats: NatsConnection,
    @Inject(NatsConn) readonly nats2: NatsConn,
  ) {
    console.log('Init TestService');
  }
}

@Module({
  imports: [NatsModule.forRoot()],
  providers: [TestService],
  exports: [TestService],
})
class DemoModule {}
