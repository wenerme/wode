import { Constructor } from '../../types';
import { ClientRequestInit, ClientRequestOptions, ClientResponse, RemoteService } from './types';

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
            body: args[0],
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

export function handleResponse({ res }: { res: ClientResponse }) {
  if (!res.ok) {
    throw Object.assign(new Error(res.description), { res, status: res.status });
  }
  return res.body;
}
