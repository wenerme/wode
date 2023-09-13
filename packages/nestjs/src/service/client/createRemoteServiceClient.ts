import { ServiceNameProp, ServiceSchema } from '../decorator';
import { IRemoteServiceClient } from './ClientRegistry';
import { handleResponse } from './handleResponse';
import { ClientRequest, ClientRequestInit, ClientResponse } from './types';

export function createRemoteServiceClient<T = unknown>({
  schema,
  invoke,
}: {
  schema: ServiceSchema<T>;
  invoke: (req: ClientRequest) => Promise<ClientResponse | AsyncIterator<ClientResponse>>;
}): T & IRemoteServiceClient {
  let Base = schema.ref || Object;

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
      let name = this.constructor?.prototype?.[ServiceNameProp];
      return `${this.constructor?.name || 'RemoteServiceClient'}(${name})`;
    }

    toJSON() {
      return {
        $RemoteServiceName: schema.name,
      };
    }
  };

  for (let method of schema.methods) {
    let methodName = method.options.name || method.name;
    Object.defineProperty(Client.prototype, method.name, {
      value: async function (req: any, opts: any = {}) {
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
