import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { DiscoveryService, ModulesContainer } from '@nestjs/core';
import { createLazyPromise } from '@wener/utils';
import type { Subscription } from 'nats';
import { App } from '../../app';
import { EXPOSE_SERVICE_METADATA_KEY, ServiceRegistry } from '../../service';
import { NatsConn } from '../NatsModule';
import { handleNatsServiceRequest } from './handleNatsServiceRequest';
import { getSubscribeSubject } from './nats';
import ServerModule from './ServerModule';
import type { NatsServiceServerModuleOptions } from './types';

const { MODULE_OPTIONS_TOKEN } = ServerModule;

@Injectable()
export class NatsServerHandler {
  private subscriptions: Subscription[] = [];
  private readonly log = new Logger(NatsServerHandler.name);
  readonly discoveryService: DiscoveryService;
  private readonly _started = createLazyPromise();

  get started(): Promise<void> {
    return this._started;
  }

  constructor(
    @Inject(ModulesContainer) private readonly modulesContainer: ModulesContainer,
    @Inject(ServiceRegistry) private readonly svc: ServiceRegistry,
    @Inject(NatsConn) readonly nc: NatsConn,
    @Optional() @Inject(MODULE_OPTIONS_TOKEN) readonly options: NatsServiceServerModuleOptions = {},
  ) {
    this.discoveryService = new DiscoveryService(modulesContainer);
  }

  async close(): Promise<void> {
    const done: Promise<any> = Promise.allSettled(
      this.subscriptions.map(async (v) =>
        v.drain().then(() => {
          v.unsubscribe();
        }),
      ),
    );
    this.subscriptions = [];
    return done;
  }

  private subscribeService({ name }: { name: string }) {
    const { getServiceSubject = getSubscribeSubject, queue = App.service } = this.options;
    const { nc, log, svc } = this;

    for (let subject of getServiceSubject({ service: name })) {
      this.log.log(`Subscribe ${subject}`);
      const sub = nc.subscribe(subject, {
        callback(err, msg) {
          if (err) {
            log.error(String(err));
            return;
          }
          if (!msg.reply) {
            log.debug(`No reply subject: ${msg.subject}`);
            return;
          }
          return handleNatsServiceRequest({ msg, registry: svc, logger: log });
        },
        queue,
      });
      this.subscriptions.push(sub);
    }
  }

  listen() {
    const { svc, log } = this;
    for (const { metatype, instance } of this.discoveryService
      .getProviders()
      .filter(({ metatype }) => metatype && Reflect.getMetadata(EXPOSE_SERVICE_METADATA_KEY, metatype))) {
      svc.addService({
        service: metatype as any,
        target: instance,
      });
    }

    const names = svc.getServiceNames();
    log.log(`Register service (${names.length}) ${names.join(', ')}`);
    for (const name of names) {
      this.subscribeService({ name });
    }

    this._started.resolve(true);
  }
}
