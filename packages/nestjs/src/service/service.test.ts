import 'reflect-metadata';
import { expect, test } from 'vitest';
import { ClientRegistry } from './client';
import { createProxyClient } from './client/ClientRegistry';
import { RemoteServiceOf } from './client/RemoteServiceOf';
import { getServiceName, Service } from './decorator/Service';
import { createServerLoggingMiddleware, ExposeMethod, ExposeService, ServiceRegistry } from './server';
import { getServiceMetadata } from './server/ServiceRegistry';

test('service in memory connect', async () => {
  const server = new ServiceRegistry();
  server.addMiddleware(createServerLoggingMiddleware());

  const registry = new ClientRegistry();

  console.log(getServiceMetadata(TestService));

  registry.connect(server.handle.bind(server));

  server.addService({
    service: TestService,
    target: new TestService(),
  });

  const client = registry.getClient(TestService);
  const res = await client.hello('world');

  console.log('Response', res);
  await expect(() => client.hidden('')).rejects.toThrow();
});

test('remote wrapper', () => {
  expect(getServiceName(RemoteTestService)).toBe(getServiceName(TestService));
  const client = createProxyClient({
    service: getServiceName(RemoteTestService)!,
    constructor: RemoteTestService,
    invoke: () => {
      throw new Error();
    },
  });
  expect(client instanceof RemoteTestService).toBeTruthy();
  expect(client instanceof TestService).toBeTruthy();
});

@Service({
  name: 'TestService',
})
@ExposeService()
class TestService {
  @ExposeMethod()
  hello(name: string) {
    return `hello ${name}`;
  }

  hidden() {
    return '';
  }
}

class RemoteTestService extends RemoteServiceOf(TestService) {}
