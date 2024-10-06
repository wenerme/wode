import os from 'node:os';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger, type OnApplicationBootstrap, type OnModuleInit } from '@nestjs/common';
import { App } from '@wener/nestjs/app';
import { getEvents, getRemoteEvents } from '@/server/events';
import { SystemEvents } from '@/server/events/events';
import { handleRemoteSystemEvents } from '@/server/events/handleRemoteSystemEvents';

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

    await getEvents().emit(SystemEvents.ServerReady, {});
    await getRemoteEvents().emit(SystemEvents.ServerReady, getInstanceInfo());
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
