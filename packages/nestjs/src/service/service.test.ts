import 'reflect-metadata';
import { expect, test } from 'vitest';
import { ClientRegistry, RemoteServiceOf } from './client';
import { createProxyClient } from './client/createProxyClient';
import { createRemoteServiceClient } from './client/createRemoteServiceClient';
import { getServiceName, getServiceSchema, Service } from './decorator';
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
  // extend inherit this method
  // expect(() => client.hidden('')).toThrow('is not a function');
});

test('class remote wrapper', () => {
  const client: RemoteTestService = createRemoteServiceClient({
    schema: getServiceSchema(RemoteTestService)!,
    invoke: () => {
      throw new Error();
    },
  });
  expect(client instanceof RemoteTestService).toBeTruthy();
  expect(client instanceof TestService).toBeTruthy();
  // works
  expect(client.hidden({})).toBe('');
});

test('proxy remote wrapper', async () => {
  expect(getServiceName(RemoteTestService)).toBe(getServiceName(TestService));
  const client: RemoteTestService = createProxyClient({
    service: getServiceName(RemoteTestService)!,
    constructor: RemoteTestService,
    invoke: () => {
      throw new Error();
    },
  });
  expect(client instanceof RemoteTestService).toBeTruthy();
  expect(client instanceof TestService).toBeTruthy();
  await expect(() => client.hidden({})).rejects.toThrow();
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
