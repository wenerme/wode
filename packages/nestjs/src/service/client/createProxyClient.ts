import type { Constructor } from '../../types';
import { handleResponse } from './handleResponse';
import type { ClientRequest, ClientRequestInit, ClientRequestOptions, ClientResponse, RemoteService } from './types';

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
          const req: ClientRequest = {
            id: Math.random().toString(36).slice(2),
            service: target.service,
            method: key,
            body: args[0],
            headers: opts.headers ?? {},
            metadata: opts.metadata ?? {},
            options: opts,
          };
          const res = await invoke(req);
          return handleResponse({
            res,
            req,
          });
        });
      }
      return target.attrs.get(key);
    },
  }) as any;
}
