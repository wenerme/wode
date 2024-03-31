import { ServiceNameProp, type ServiceSchema } from '../meta';
import type { IRemoteServiceClient } from './ClientRegistry';
import { handleResponse } from './handleResponse';
import type { ClientRequest, ClientRequestOptions, ClientResponse } from './types';

export function createRemoteServiceClient<T = unknown>({
  schema,
  invoke,
}: {
  schema: ServiceSchema<T>;
  invoke: (req: ClientRequest) => Promise<ClientResponse | AsyncIterator<ClientResponse>>;
}): T & IRemoteServiceClient {
  const Base = schema.ref || Object;

  const Client = class RemoteServiceClient extends Base implements IRemoteServiceClient {
    static [ServiceNameProp]: '';
    $schema: ServiceSchema;
    $invoke: (req: ClientRequest) => Promise<ClientResponse | AsyncIterator<ClientResponse>>;
    $options: ClientRequestOptions;

    constructor({
      schema,
      invoke,
      $options = {},
    }: {
      schema: ServiceSchema;
      invoke: (req: ClientRequest) => Promise<ClientResponse | AsyncIterator<ClientResponse>>;
      $options?: ClientRequestOptions;
    }) {
      super();
      this.$schema = schema;
      this.$invoke = invoke;
      this.$options = $options;
    }

    toString() {
      const name = this.constructor?.prototype?.[ServiceNameProp];
      return `${this.constructor?.name || 'RemoteServiceClient'}(${name})`;
    }

    toJSON() {
      return {
        $Service$: this.$schema.name,
      };
    }
  };

  (Client as any)[ServiceNameProp] = schema.name;

  for (const method of schema.methods) {
    const methodName = method.options.name || method.name;
    Object.defineProperty(Client.prototype, method.name, {
      async value(req: any, opts: any = {}) {
        const res = await this.$invoke({
          id: Math.random().toString(36).slice(2),
          service: schema.name,
          method: methodName,
          body: req,
          headers: { ...this.$options.headers, ...opts.headers },
          metadata: { ...this.$options.metadata, ...opts.headers },
          options: { ...this.$options, ...opts },
        });
        return handleResponse({
          res,
          req,
        });
      },
    });
  }

  return new Client({ schema, invoke }) as any;
}
