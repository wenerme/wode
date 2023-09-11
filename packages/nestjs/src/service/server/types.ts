import type { ServiceRequest, ServiceResponse } from '../schema';

type IsValidArg<T> = T extends object ? (keyof T extends never ? false : true) : true;

type AddParameters<T, X> = T extends (a: infer A, b: infer B) => infer R
  ? IsValidArg<A> extends true
    ? (a: A, opts: X) => Promise<Awaited<R>>
    : (a: any, opts: X) => Promise<Awaited<R>>
  : never;

type InterfaceWithExtraParameters<T, X> = {
  [P in keyof T]: AddParameters<T[P], X>;
};

export interface ServerRequestContext {
  id: string;
  headers: Record<string, string>;
  metadata: Record<string, any>;
}

export type LocalService<T> = InterfaceWithExtraParameters<T, ServerRequestContext>;

export type ServerResponse = ServiceResponse;

export type ServerRequest = ServiceRequest;
