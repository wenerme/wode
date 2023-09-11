import { ServiceNameProp, ServiceSchema } from '../decorator';
import { IRemoteServiceClient } from './ClientRegistry';
import { handleResponse } from './createProxyClient';
import { ClientRequestInit, ClientResponse } from './types';

export function createRemoteServiceClient<T = unknown>({
  schema,
  invoke,
}: {
  schema: ServiceSchema<T>;
  invoke: (req: ClientRequestInit) => Promise<ClientResponse>;
}): T & IRemoteServiceClient {
  let Base = schema.ref || Object;

  const Client = class RemoteServiceClient extends Base {
    static [ServiceNameProp] = schema.name;
    $schema: ServiceSchema;
    $invoke: (req: ClientRequestInit) => Promise<ClientResponse>;

    constructor({
      schema,
      invoke,
    }: {
      schema: ServiceSchema;
      invoke: (req: ClientRequestInit) => Promise<ClientResponse>;
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
          service: schema.name,
          method: methodName,
          input: req,
          headers: opts.headers,
          metadata: opts.metadata,
        });
        return handleResponse({
          res,
        });
      },
    });
  }

  return new Client({ schema, invoke }) as any;
}
