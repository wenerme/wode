import type { ReactNode } from 'react';
import type { RouteObject, UIMatch } from 'react-router-dom';

export { useRouteTitles } from './useRouteTitles';
export { usePrompt } from './usePrompt';

declare module 'react-router-dom' {
  export interface IndexRouteObject {
    meta?: KnownRouteObjectMeta;
  }

  export interface NonIndexRouteObject {
    meta?: KnownRouteObjectMeta;
  }
}

export interface KnownRouteObjectHandle {
  title?: RouteHandleTitle;

  [key: string]: any;
}

type RouteHandleTitle = string | ((data: any, match: UIMatch<unknown, KnownRouteObjectHandle>) => string);

export interface KnownRouteObjectMeta {
  id?: string;
  title?: string;
  icon?: ReactNode;
  menu?: Record<string, any>;

  [key: string]: any;
}

export type RouteObjects = RouteObject[];

type ImmutableRouteKey = 'lazy' | 'caseSensitive' | 'path' | 'id' | 'index' | 'children';

type DynamicRouteObject = Omit<RouteObject, ImmutableRouteKey>;
type RequireOne<T, Key = keyof T> = Exclude<
  {
    [K in keyof T]: K extends Key ? Omit<T, K> & Required<Pick<T, K>> : never;
  }[keyof T],
  undefined
>;

export function lazyRoute<R extends object = RequireOne<Omit<RouteObject, ImmutableRouteKey>>>(
  loader: () => Promise<R | { default: R } | { route: R }>,
): () => Promise<R> {
  return () =>
    loader().then((v) => {
      if ('route' in v) {
        return v.route;
      }
      if ('default' in v) {
        return v.default;
      }
      return v;
    });
}
