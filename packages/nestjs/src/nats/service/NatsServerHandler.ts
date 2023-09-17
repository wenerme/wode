import type { Subscription } from 'nats';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, ModulesContainer } from '@nestjs/core';
import { createLazyPromise } from '@wener/utils';
import { App } from '../../app';
import { EXPOSE_SERVICE_METADATA_KEY, ServiceRegistry } from '../../service';
import { NatsConn } from '../nats.module';
import { NATS_SERVICE_SERVER_OPTIONS } from './const';
import { handleNatsServiceServerMessage } from './handleNatsServiceServerMessage';
import { getSubscribeSubject } from './nats';
import type { NatsServiceServerOptions } from './types';

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
    @Inject(NATS_SERVICE_SERVER_OPTIONS) readonly options: NatsServiceServerOptions,
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
          return handleNatsServiceServerMessage({ msg, registry: svc, logger: log });
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
