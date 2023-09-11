import { Injectable } from '@nestjs/common';
import type { Constructor } from '../../types';
import { getServiceName } from '../decorator/Service';
import type {
  ClientConnection,
  ClientRequest,
  ClientRequestInit,
  ClientRequestOptions,
  ClientResponse,
  RemoteService,
} from './types';

export type ClientMiddleware = (next: ClientConnection) => ClientConnection;

@Injectable()
export class ClientRegistry {
  private clients = new Map<any, any>();

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

  getClient<T>(svc: Constructor<T>): RemoteService<T>;
  getClient<T>(svc: string): RemoteService<T>;
  getClient<T>(svc: any): RemoteService<T> {
    const service = getServiceName(svc);
    if (!service) {
      throw new Error(`Service ${svc} not found`);
    }
    let client = this.clients.get(service);
    if (!client) {
      client = this.createClient({ service, constructor: typeof svc === 'function' ? svc : undefined });
      this.clients.set(service, client);
    }
    return client;
  }

  private createClient<T>(opts: { service: string; constructor?: Constructor<any> }): RemoteService<T> {
    return createProxyClient({
      ...opts,
      invoke: this.send,
    });
  }

  send = async (init: ClientRequestInit): Promise<ClientResponse> => {
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

interface ClientProxyTarget {
  service: string;
  methods: Record<string, Function>;
  attrs: Map<any, any>;
  constructor?: Constructor<any>;
}

export function createProxyClient<T>({
  invoke,
  ...opts
}: {
  service: string;
  constructor?: Constructor<any>;
  invoke: (req: ClientRequestInit) => Promise<ClientResponse>;
}): RemoteService<T> {
  const ctx: ClientProxyTarget = {
    service: opts.service,
    methods: {} as Record<string | symbol, Function>,
    attrs: new Map(),
    constructor: opts.constructor,
  };
  return new Proxy(ctx, {
    getPrototypeOf(target: ClientProxyTarget): object | null {
      return target.constructor?.prototype || null;
    },
    has(target, key): boolean {
      switch (key) {
        case 'toString':
        case 'toJSON':
      }
      return false;
    },
    get: (target, key) => {
      if (key === Symbol.hasInstance) {
        let last = target.attrs.get(key);
        if (!last) {
          last = (instance: any) => {
            if (instance === Proxy) {
              return true;
            }
            if (!target.constructor) {
              return false;
            }
            return instance instanceof target.constructor;
          };
          target.attrs.set(key, last);
        }
        return last;
      }
      // fixme by explicit method check
      switch (key) {
        case 'then':
        case 'catch':
        case 'finally':
        case 'onModuleInit':
        case 'onModuleDestroy':
        case 'onApplicationBootstrap':
        case 'onApplicationShutdown':
        case 'beforeApplicationShutdown':
          return undefined;
        case 'constructor':
          return target.constructor;
        case 'toString':
          return () => `${target.constructor?.name || 'RemoteService'}(${target.service})`;
        case 'toJSON':
          return () => `${target.constructor?.name || 'RemoteService'}(${target.service})`;
      }
      if (typeof key === 'string') {
        return (target.methods[key] ||= async (...args: any[]) => {
          const opts = (args[1] || {}) as ClientRequestOptions;
          const res = await invoke({
            service: target.service,
            method: key,
            input: args[0],
            headers: opts.headers,
          });
          return handleResponse({
            res,
          });
        });
      }
      return target.attrs.get(key);
    },
  }) as any;
}

function handleResponse({ res }: { res: ClientResponse }) {
  if (!res.ok) {
    throw Object.assign(new Error(res.description), { res, status: res.status });
  }
  return res.output;
}
