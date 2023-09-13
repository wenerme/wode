import { NatsConnection } from 'nats';
import { Injectable } from '@nestjs/common';
import type { AbstractConstructor, Constructor } from '../../types';
import { getServiceSchema, ServiceSchema } from '../decorator';
import { getServiceName } from '../decorator/Service';
import { createProxyClient } from './createProxyClient';
import { createRemoteServiceClient } from './createRemoteServiceClient';
import type { ClientConnection, ClientRequest, ClientRequestInit, ClientResponse, RemoteService } from './types';

export type ClientMiddleware = (next: ClientConnection) => ClientConnection;

interface RemoteClientEntry {
  schema: ServiceSchema;
  client: IRemoteServiceClient;
}

export interface IRemoteServiceClient {}

@Injectable()
export class ClientRegistry {
  private clients = new Map<string, RemoteClientEntry>();

  private conn: ClientConnection = () => {
    throw new Error('ServiceClientConnection not connected');
  };
  private handler?: ClientConnection;

  #middlewares: ClientMiddleware[] = [];
  get middlewares(): ClientMiddleware[] {
    const out = Array.from(this.#middlewares);
    Object.freeze(out);
    return out;
  }

  set middlewares(v: ClientMiddleware[]) {
    this.#middlewares = Array.from(v);
    this.handler = undefined;
  }

  addMiddleware(v: ClientMiddleware) {
    this.#middlewares.push(v);
    this.handler = undefined;
  }

  getClient<T>(svc: Constructor<T> | AbstractConstructor<T>): RemoteService<T>;
  // getClient<T>(svc: string): RemoteService<T>;
  getClient<T>(svc: any): RemoteService<T> {
    const service = getServiceName(svc);
    if (!service) {
      throw new Error(`Service ${svc} not found`);
    }
    let last = this.clients.get(service);
    if (!last) {
      const schema = getServiceSchema(svc);
      if (!schema) {
        throw new Error(`Service ${svc} not found`);
      }
      last = {
        schema,
        client: createRemoteServiceClient({ schema, invoke: this.send }),
      };
      this.clients.set(service, last);
    }
    return last.client as any;
    // let client = this.clients.get(service);
    // if (!client) {
    //   client = this.createClient({ service, constructor: typeof svc === 'function' ? svc : undefined });
    //   this.clients.set(service, client);
    // }
    // return client;
  }

  // private createClient<T>(opts: { service: string; constructor?: Constructor<any> }): RemoteService<T> {
  //   return createProxyClient({
  //     ...opts,
  //     invoke: this.send,
  //   });
  // }

  send = async (init: ClientRequestInit): Promise<ClientResponse | AsyncIterator<ClientResponse>> => {
    const req: ClientRequest = {
      ...init,
      id: init.id || Math.random().toString(36).slice(2),
      headers: init.headers || {},
      metadata: init.metadata || {},
    };

    const handler = (this.handler ||= this.middlewares.reduceRight((next, middleware) => middleware(next), this.conn));
    return handler(req);
  };

  connect(conn: ClientConnection) {
    this.conn = conn;
    this.handler = undefined;
  }
}
