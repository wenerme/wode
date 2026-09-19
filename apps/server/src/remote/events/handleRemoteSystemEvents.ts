import { Logger } from '@nestjs/common';
import { App } from '@wener/server/app';
import { SystemEvents } from '#/events';
import { getRemoteEmitter, RemoteEvents } from './RemoteEmitter';
import { buildRemoteEvent, runRemoteEventHandler } from './runRemoteEventHandler';

function getRedis() {
	// fixme stud code here
	return {} as any;
}

export async function handleRemoteSystemEvents() {
	const log = new Logger(handleRemoteSystemEvents.name);
	let redis = getRedis();
	let remote = getRemoteEmitter();
	await runRemoteEventHandler({
		events: remote,
		redis,
	});

	remote.on(RemoteEvents.ServerInfo, (event) => {
		const { instanceId, name, service } = event.data;
		log.log(`-> Server Info: ${name} ${instanceId} ${service}`);
	});

	// handle common events
	remote.on(SystemEvents.ServerReady, (evt) => {
		const { instanceId, dev, hostname } = evt.data;
		log.log(`-> Server Ready ${instanceId} ${hostname} ${dev}`);
		if (instanceId === App.instanceId) {
			return;
		}
		void remote.emit(RemoteEvents.ServerInfo, buildRemoteEvent(evt.data, { targetInstanceId: instanceId }));
	});

	remote.on(RemoteEvents.ServerPing, (evt) => {
		log.log(`-> Server Ping: ${evt.data.name} ${evt.data.instanceId} ${evt.data.service}`);
		void remote.emit(
			RemoteEvents.ServerPong,
			buildRemoteEvent(evt.data, {
				targetInstanceId: evt.data.instanceId,
			}),
		);
	});
	remote.on(RemoteEvents.ServerPong, (evt) => {
		log.log(`-> Server Pong: ${evt.data.name} ${evt.data.instanceId} ${evt.data.service}`);
	});
}
