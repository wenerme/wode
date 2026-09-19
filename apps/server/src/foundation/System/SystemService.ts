import os from 'node:os';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger, type OnApplicationBootstrap, type OnModuleInit } from '@nestjs/common';
import { App } from '@wener/server/app';
import { getSystemEmitter, SystemEvents } from '@/events';
import { getRemoteEmitter } from '@/remote/events';

@Injectable()
export class SystemService implements OnApplicationBootstrap, OnModuleInit {
	private log = new Logger(SystemService.name);

	constructor(@Inject(EntityManager) protected readonly em: EntityManager) {}

	async onModuleInit() {
		this.log.log('Server starting');
		await this.start();
	}

	private async start() {
		// await handleRemoteSystemEvents();
	}

	async onApplicationBootstrap() {
		await this.ready();
	}

	private async ready() {
		const { log } = this;
		log.log('Server ready');

		await getSystemEmitter().emit(SystemEvents.ServerReady, {});
		await getRemoteEmitter().emit(SystemEvents.ServerReady, getInstanceInfo());
	}
}

function getInstanceInfo() {
	return {
		instanceId: App.instanceId,
		name: App.name,
		component: App.component,
		service: App.service,
		hostname: os.hostname(),
		dev: App.isDevelopment,
	};
}
