import type { Optional } from '../../types';
import type { ServiceRequest, ServiceResponse } from '../schema';

type IsValidArg<T> = T extends Record<string, unknown> ? (keyof T extends never ? false : true) : true;

type AddOptionalParameters<T, X> = T extends (a: infer A, b: infer B) => infer R
  ? IsValidArg<A> extends true
    ? (a: A, opts?: X) => Promise<Awaited<R>>
    : (a: any, opts?: X) => Promise<Awaited<R>>
  : never;

type InterfaceWithExtraOptionalParameters<T, X> = {
  [P in keyof T]: AddOptionalParameters<T[P], X>;
};

export interface ClientRequestOptions {
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
  timeout?: number;
  signal?: AbortSignal;
}

export type RemoteService<T> = InterfaceWithExtraOptionalParameters<T, ClientRequestOptions>;

export type ClientResponse = ServiceResponse;

export type ClientRequestInit = Optional<ClientRequest, 'id' | 'headers' | 'metadata'>;

export type ClientRequest = ServiceRequest & {
  options: ClientRequestOptions;
};

export type ClientConnection = (req: ClientRequest) => Promise<ClientResponse | AsyncIterator<ClientResponse>>;
// export type ClientConnection = (req: ClientRequest) => Promise<AsyncIterator<ClientResponse>>;
