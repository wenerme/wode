import { applyDecorators, Injectable, Logger, SetMetadata } from '@nestjs/common';
import type { Constructor } from '../../types';
import type { MethodOptions, ServiceOptions, ServiceSchema } from '../decorator';
import { getServiceName, METHOD_METADATA_KEY, SERVICE_METADATA_KEY } from '../decorator';
import { createResponse } from './createResponse';
import type { ServerRequest, ServerRequestContext, ServerResponse } from './types';

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

  addMiddleware(v: ServerMiddleware) {
    this.#middlewares.push(v);
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
    const ctx: ServerRequestContext = {
      id: req.id,
      metadata: req.metadata,
      headers: req.headers,
    };
    if (!svc) {
      return createResponse(req, {
        code: 404,
        status: 'NotFound',
        description: `Service ${req.service} not found`,
        ok: false,
      });
    }
    let method = svc.target[req.method];
    // require exposed
    if (!svc.metadata.methods[req.method]) {
      method = null;
    }
    if (!method) {
      return createResponse(req, {
        code: 404,
        status: 'NotFound',
        description: `Service ${req.service} method ${req.method} not found`,
        ok: false,
      });
    }
    if (typeof method !== 'function') {
      return createResponse(req, {
        code: 500,
        status: 'ServerError',
        description: `Service ${req.service} method ${req.method} invalid`,
        ok: false,
      });
    }
    try {
      const output = await method.call(svc.target, req.input, ctx);
      return createResponse(req, {
        output,
        ok: true,
      });
    } catch (e) {
      this.log.error(`Service ${req.service} method ${req.method} error: ${e}`);
      return createResponse(req, {
        code: 500,
        status: 'ServerError',
        description: String(e),
        ok: false,
      });
    }
  };

  handle(req: ServerRequest): Promise<ServerResponse> {
    const handler = (this.handler ||= this.middlewares.reverse().reduce((f, m) => m(f), this._handle));
    return handler(req);
  }
}

export type ServerHandler = (req: ServerRequest) => Promise<ServerResponse>;
export type ServerMiddleware = (next: ServerHandler) => ServerHandler;

interface Service {
  name: string;
  target: any;
  schema?: ServiceSchema;
  metadata: ServiceMetadata;
}

export interface RegisterServiceOptions<T = any> {
  service: string | Constructor<T>;
  target: T;
  schema?: ServiceSchema;
}

export interface ExposeServiceOptions extends Partial<ServiceOptions> {
  as?: Function;
}

export type ExposeMethodOptions = MethodOptions;

interface ServiceMetadata {
  name: string;
  constructor: any;
  methods: Record<
    string,
    {
      name: string;
      input?: any;
      output?: any;
    }
  >;
}

export const EXPOSE_SERVICE_METADATA_KEY = SERVICE_METADATA_KEY;
export const EXPOSE_METHOD_METADATA_KEY = METHOD_METADATA_KEY;

export const ExposeService = (opts: ExposeServiceOptions = {}): ClassDecorator =>
  // Reflect.metadata(EXPOSE_SERVICE_METADATA_KEY, opts);
  applyDecorators(SetMetadata(EXPOSE_SERVICE_METADATA_KEY, opts), Injectable());

export const ExposeMethod = (opts: ExposeMethodOptions = {}): MethodDecorator =>
  Reflect.metadata(EXPOSE_METHOD_METADATA_KEY, opts); // target.prototype

export function getServiceMetadata<T>(svc: Constructor<T>): ServiceMetadata | undefined {
  const so: ExposeServiceOptions = Reflect.getMetadata(EXPOSE_SERVICE_METADATA_KEY, svc);
  if (!so) {
    return;
  }
  const name = getServiceName(svc) || getServiceName(so.as);
  if (!name) {
    return;
  }

  const methods = Object.fromEntries(
    Object.getOwnPropertyNames(svc.prototype)
      .map((key) => {
        const value = svc.prototype[key];
        if (typeof value !== 'function') {
          return;
        }
        const meta = Reflect.getMetadata(EXPOSE_METHOD_METADATA_KEY, svc.prototype, key);
        if (!meta) {
          return;
        }
        return {
          name: key,
          ...meta,
        };
      })
      .filter(Boolean)
      .map((v) => [v.name, v]),
  );

  return {
    name,
    constructor: svc,
    methods: methods,
  };
}
