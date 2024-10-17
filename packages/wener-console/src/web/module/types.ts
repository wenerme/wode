import type { ReactElement } from 'react';
import type { ArrayPath, Path, PathValue } from 'react-hook-form';
import type { RouteObject } from 'react-router-dom';
import type { MaybePromise } from '@wener/utils';

export interface ModuleStore<O extends Record<string, any> = Record<string, any>> {
  set<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(
    type: P,
    payload: V,
    options?: { merge?: boolean },
  ): void;

  get<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(path: P): V;

  add<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(
    type: P,
    payload: V extends Array<any> ? V | V[number] : V,
  ): void;

  collect<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(path: P): V;

  as<T extends Record<string, any>>(): ModuleStore<T>;
}

export interface KnownDynamicModuleMetadata {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  version?: string;
  tags?: string[];

  dependencies?: string[];

  [key: string]: any;
}

export interface ModuleContext extends ModuleStore {}

export interface DynamicModule {
  onModuleInit?: (ctx: ModuleContext) => MaybePromise<void>;
  createRoutes?: (ctx: ModuleContext) => MaybePromise<RouteObject[]>;
  element?: ReactElement;
  metadata?: KnownDynamicModuleMetadata;
}
