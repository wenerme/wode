import { Logger } from '@nestjs/common';
import type { NatsConnection, NatsError, ServiceMsg } from 'nats';
import { App } from '../../app';
import { getServerServiceSchema, getServiceName, ServiceRegistry } from '../../service';
import { handleNatsServiceRequest } from './handleNatsServiceRequest';
import { getRequestSubject } from './nats';

export async function addNatsService({
  registry = ServiceRegistry.get(),
  service,
  nc,
  logger,
  getSubject = getRequestSubject,
}: {
  registry?: ServiceRegistry;
  nc: NatsConnection;
  service: any;
  logger?: Logger;
  getSubject?: (o: { service: string; method: string }) => string;
}) {
  let ss = getServerServiceSchema(service);
  if (!ss) {
    throw new Error(`Invalid service: ${service}`);
  }
  const name = getServiceName(service);
  if (!name) {
    throw new Error(`Invalid service options: ${service}`);
  }
  const log = logger || new Logger(`NatsService@${name}`);

  let sub = name.replaceAll(/[.]/g, '_');
  log.log(`listen ${sub} { ${ss.methods.map((v) => v.name)} }`);
  const svc = await nc.services.add({
    version: ss.options.version || '1.0.0',
    name: sub,
    queue: App.service,
    metadata: {},
  });

  for (let ms of ss.methods) {
    void svc.addEndpoint(ms.name, {
      subject: getSubject({ service: name, method: ms.name }),
      queue: App.service,
      metadata: {
        // schema: JSON.stringify({
        //   request: ms.request,
        //   response: ms.response,
        // }),
      },
      handler: async (err: NatsError | null, msg: ServiceMsg) => {
        await handleNatsServiceRequest({ err, msg, registry, logger: log });
      },
    });
  }
}
