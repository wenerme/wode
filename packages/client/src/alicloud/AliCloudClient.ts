import { Constructor, FetchLike } from '@wener/utils';
import { AliCloudApis } from './apis';
import { AliCloudRequestOptions, request } from './request';

export interface AliCloudClientOptions {
  endpoint?: string;
  version?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  fetch?: FetchLike;
  headers?: Record<string, any>;
}

export class AliCloudClient {
  readonly options: AliCloudClientOptions;
  private static APIS: Record<string, { endpoint: string; product: string; version: string }> = {};

  static {
    this.registry({ product: 'Dytnsapi', version: '2020-02-17' }, { endpoint: 'dytnsapi.aliyuncs.com' });
  }

  static registry({ product, version }: { product: string; version: string }, val: { endpoint: string }) {
    this.APIS[`${product}/${version}`] = { ...this.APIS[`${product}/${version}`], ...val, product, version };
  }

  static getService(svc: { product: string; version: string }) {
    return this.APIS[`${svc.product}/${svc.version}`];
  }

  constructor(o: Partial<AliCloudClientOptions>) {
    this.options = {
      ...o,
    };
  }

  request<T>(options: AliCloudRequestOptions<T>) {
    return request({
      ...this.options,
      ...options,
      headers: {
        ...this.options.headers,
        ...options.headers,
      },
    });
  }

  getServiceClient<P extends keyof AliCloudApis, V extends keyof AliCloudApis[P] & string>({
    product,
    version,
    endpoint,
  }: {
    product: P;
    version: V;
    endpoint?: string;
  }): AliCloudApis[P][V] {
    endpoint ??= AliCloudClient.getService({ product, version })?.endpoint;
    if (!endpoint) {
      throw new Error(`No endpoint for ${product}/${version}`);
    }
    const ctx: ProxyClientTarget = {
      product,
      version,
      endpoint,
      attrs: new Map(),
      methods: {},
      constructor: AliCloudClient,
    };
    const client: AliCloudClient = this;
    return new Proxy(ctx, {
      getPrototypeOf(target: ProxyClientTarget) {
        return target.constructor?.prototype || null;
      },
      has(target, key): boolean {
        switch (key) {
          case 'toString':
          case 'toJSON':
        }

        return false;
      },
      get(target, key) {
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
          case 'beforeApplicationShutdown': {
            return undefined;
          }

          case 'constructor': {
            return target.constructor;
          }

          case 'toString': {
            return () => `${target.constructor?.name || 'AliCloudClient'}(${target.product}/${target.version})`;
          }

          case 'toJSON': {
            return () => `${target.constructor?.name || 'AliCloudClient'}(${target.product}/${target.version})`;
          }
        }

        if (typeof key === 'string') {
          return (target.methods[key] ||= async (...args: any[]) => {
            const { version, endpoint } = target;
            const req: AliCloudRequestOptions<any> = {
              version,
              endpoint,
              action: key,
              ...((args[1] || {}) as AliCloudRequestOptions<any>),
            };
            return client.request(req);
          });
        }

        return target.attrs.get(key);
      },
    }) as any;
  }
}

interface ProxyClientTarget {
  product: string;
  version: string;
  endpoint: string;
  attrs: Map<string | symbol, any>;
  methods: Record<string, Function>;
  constructor?: Constructor<any>;
}
