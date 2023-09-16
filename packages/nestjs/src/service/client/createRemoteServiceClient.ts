import type { ServiceSchema } from '../decorator';
import { ServiceNameProp } from '../decorator';
import type { IRemoteServiceClient } from './ClientRegistry';
import { handleResponse } from './handleResponse';
import type { ClientRequest, ClientResponse } from './types';

export function createRemoteServiceClient<T = unknown>({
  schema,
  invoke,
}: {
  schema: ServiceSchema<T>;
  invoke: (req: ClientRequest) => Promise<ClientResponse | AsyncIterator<ClientResponse>>;
}): T & IRemoteServiceClient {
  const Base = schema.ref || Object;

  const Client = class RemoteServiceClient extends Base {
    static [ServiceNameProp] = schema.name;
    $schema: ServiceSchema;
    $invoke: (req: ClientRequest) => Promise<ClientResponse | AsyncIterator<ClientResponse>>;

    constructor({
      schema,
      invoke,
    }: {
      schema: ServiceSchema;
      invoke: (req: ClientRequest) => Promise<ClientResponse | AsyncIterator<ClientResponse>>;
    }) {
      super();
      this.$schema = schema;
      this.$invoke = invoke;
    }

    toString() {
      const name = this.constructor?.prototype?.[ServiceNameProp];
      return `${this.constructor?.name || 'RemoteServiceClient'}(${name})`;
    }

    toJSON() {
      return {
        $RemoteServiceName: schema.name,
      };
    }
  };

  for (const method of schema.methods) {
    const methodName = method.options.name || method.name;
    Object.defineProperty(Client.prototype, method.name, {
      async value(req: any, opts: any = {}) {
        const res = await this.$invoke({
          id: Math.random().toString(36).slice(2),
          service: schema.name,
          method: methodName,
          body: req,
          headers: opts.headers,
          metadata: opts.metadata,
          options: opts,
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
