import { applyDecorators, Injectable, Logger, SetMetadata } from '@nestjs/common';
import type { Constructor } from '../../types';
import type { MethodOptionsInit, ServiceOptions, ServiceOptionsInit, ServiceSchema, MethodSchema } from '../decorator';
import { getServiceSchema, METHOD_METADATA_KEY, SERVICE_METADATA_KEY } from '../decorator';
import { createResponse } from './createResponse';
import type { ServerRequest, ServerRequestOptions, ServerResponse } from './types';

export class ServiceRegistry {
  private readonly log = new Logger(ServiceRegistry.name);
  private services: Record<string, Service> = {};
  private handler?: ServerHandler;

  getServiceNames() {
    return Object.keys(this.services);
  }

  #middlewares: ServerMiddleware[] = [];
  get middlewares(): ServerMiddleware[] {
    const out = Array.from(this.#middlewares);
    Object.freeze(out);
    return out;
  }

  set middlewares(v: ServerMiddleware[]) {
    this.#middlewares = Array.from(v);
    this.handler = undefined;
  }

  addMiddleware(v: ServerMiddleware | Array<ServerMiddleware>) {
    if (Array.isArray(v)) {
      this.#middlewares.push(...v);
    } else {
      this.#middlewares.push(v);
    }
    this.handler = undefined;
  }

  addService({ service, target }: RegisterServiceOptions) {
    const { log } = this;
    // log.log(`Register service=${reg.name} methods=${svc.methods.map((v) => v.name).join(',')}`);
    const metadata = getServiceMetadata(target.constructor);
    const name = metadata?.name;
    if (!metadata || !name) {
      throw new Error(`Service ${name || target} metadata not found`);
    }
    if (this.services[name]) {
      throw new Error(`Service ${name} already registered`);
    }
    this.services[name] = {
      name,
      target,
      metadata,
    };
  }

  private _handle = async (req: ServerRequest): Promise<ServerResponse> => {
    const svc = this.services[req.service];
    const ctx: ServerRequestOptions = {
      id: req.id,
      metadata: req.metadata,
      headers: req.headers,
      options: {},
    };
    if (!svc) {
      return createResponse(req, {
        status: 404,
        description: `Service ${req.service} not found`,
      });
    }
    // require exposed
    const methodSchema = svc.metadata.methods.find((v) => {
      const name = v.options?.name || v.name;
      return req.method === name;
    });
    if (!methodSchema) {
      return createResponse(req, {
        status: 404,
        description: `Service ${req.service} method ${req.method} not found`,
      });
    }

    let method: Function | undefined;
    method = svc.target[methodSchema.name];
    ctx.options = methodSchema?.options ?? {};

    if (!method) {
      return createResponse(req, {
        status: 404,
        description: `Service ${req.service} method ${req.method} not found`,
      });
    }
    if (typeof method !== 'function') {
      return createResponse(req, {
        status: 500,
        description: `Service ${req.service} method ${req.method} invalid`,
      });
    }
    try {
      const output = await method.call(svc.target, req.body, ctx);
      return createResponse(req, {
        body: output,
      });
    } catch (e) {
      this.log.error(`Handle ${req.service}#${req.method} error: ${e}`);
      return createResponse(req, {
        status: 500,
        description: String(e),
      });
    }
  };

  handle(req: ServerRequest): Promise<ServerResponse> {
    const handler = (this.handler ||= this.middlewares.reduceRight(
      (next, middleware) => middleware(next),
      this._handle,
    ));
    return handler(req);
  }
}

export type ServerHandler = (req: ServerRequest) => Promise<ServerResponse>;
export type ServerMiddleware = (next: ServerHandler) => ServerHandler;

interface Service {
  name: string;
  target: any;
  schema?: ServiceSchema;
  metadata: ServerServiceSchema;
}

export interface RegisterServiceOptions<T = any> {
  service: string | Constructor<T>;
  target: T;
  schema?: ServiceSchema;
}

export type ExposeServiceOptions = ServiceOptions;

export type ExposeMethodOptions = MethodOptionsInit;

interface ServerServiceSchema extends ServiceSchema {
  name: string;
  options: ExposeServiceOptions;
  methods: MethodSchema[];
}

export const EXPOSE_SERVICE_METADATA_KEY = SERVICE_METADATA_KEY;
export const EXPOSE_METHOD_METADATA_KEY = METHOD_METADATA_KEY;

export const ExposeService = (opts: ServiceOptionsInit = {}): ClassDecorator =>
  // Reflect.metadata(EXPOSE_SERVICE_METADATA_KEY, opts);
  applyDecorators(SetMetadata(EXPOSE_SERVICE_METADATA_KEY, opts), Injectable());

export const ExposeMethod = (opts: ExposeMethodOptions = {}): MethodDecorator =>
  Reflect.metadata(EXPOSE_METHOD_METADATA_KEY, opts); // target.prototype

export function getServiceMetadata<T>(svc: Constructor<T>): ServerServiceSchema | undefined {
  const schema = getServiceSchema(svc) as ServerServiceSchema;
  if (!schema) {
    return;
  }
  let base: undefined | ServiceSchema<T>;
  if (schema.options?.as) {
    base = getServiceSchema(svc);
    if (!base) {
      throw new Error(`Service ${svc} base ${schema.options.as} is invalid`);
    }
  }

  return schema;
}
