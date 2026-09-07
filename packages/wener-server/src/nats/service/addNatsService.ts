import type { NatsConnection } from '@nats-io/nats-core';
import { type ServiceMsg, Svcm } from '@nats-io/services';
import { Logger } from '@nestjs/common';
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
	log.log(`listen ${sub} { ${ss.methods.map((v) => v.name).join(', ')} }`);
	const svc = await new Svcm(nc).add({
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
			handler: (err: Error | null, msg: ServiceMsg) => {
				void handleNatsServiceRequest({ err, msg, registry, logger: log }).catch((error) => log.error(String(error)));
			},
		});
	}
}
