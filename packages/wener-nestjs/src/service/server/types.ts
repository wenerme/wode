import type { MaybePromise } from '@wener/utils';
import type { MethodOptionsInit } from '../meta';
import type { ServiceRequest, ServiceResponse } from '../schema';

type IsValidArg<T> = T extends Record<string, unknown> ? (keyof T extends never ? false : true) : true;

type AddParameters<T, X> = T extends (a: infer A, b: infer B) => infer R
  ? IsValidArg<A> extends true
    ? (req: A, options: X) => MaybePromise<R>
    : (req: any, options: X) => MaybePromise<R>
  : never;

type InterfaceWithExtraParameters<T, X> = {
  [P in keyof T]: AddParameters<T[P], X>;
};

export interface ServerRequestOptions {
  id: string;
  headers: Record<string, string>;
  metadata: Record<string, any>;
  options: MethodOptionsInit;
}

export type LocalService<T> = InterfaceWithExtraParameters<T, ServerRequestOptions>;

export type ServerResponse = ServiceResponse;

export type ServerRequest = ServiceRequest;
