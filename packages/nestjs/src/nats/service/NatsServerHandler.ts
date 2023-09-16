import type { NatsConnection, Subscription } from 'nats';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, ModulesContainer } from '@nestjs/core';
import { createLazyPromise } from '@wener/utils';
import { App } from '../../app';
import type { ServerRequest, ServerResponse } from '../../service';
import { EXPOSE_SERVICE_METADATA_KEY, ServiceRegistry, ServiceRequestSchema } from '../../service';
import { createResponse } from '../../service/server/createResponse';
import { NatsConn } from '../nats.module';
import { fromMessageHeader, getSubscribeSubject, toMessageHeader } from './nats';

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
    const { nc, log, svc } = this;

    const sub = nc.subscribe(getSubscribeSubject({ service: name }), {
      async callback(err, msg) {
        if (err) {
          log.error(String(err));
          return;
        }

        if (!msg.reply) {
          log.debug(`No reply subject: ${msg.subject}`);
          return;
        }

        let res: ServerResponse | undefined;
        let cause: any | undefined;
        let req: ServerRequest;
        try {
          req = ServiceRequestSchema.parse(JSON.parse(msg.string()));
          fromMessageHeader(req, msg.headers);
        } catch (error) {
          msg.respond(
            JSON.stringify(
              createResponse(
                {},
                {
                  code: 400,
                  description: `Invalid request: ${String(error)}`,
                },
              ),
            ),
            {},
          );
          return;
        }

        try {
          res = await svc.handle(req);
        } catch (error) {
          cause = error;
        }

        if (!res) {
          if (cause) {
            log.error(`Handle ${req.service}#${req.method} error: ${cause}`);
            res = createResponse(req, {
              status: 500,
              description: String(cause),
            });
          } else if (!res) {
            res = createResponse(req, {
              status: 500,
              description: 'Invalid Response',
            });
          }
        }

        const { headers: _, ...write } = res;
        const hdr = toMessageHeader(res);
        msg.respond(JSON.stringify(write), {
          headers: hdr,
        });
      },
      queue: App.service,
    });
    this.subscriptions.push(sub);
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
