import type { ReactNode } from 'react';
import type { LazyRouteFunction, RouteObject, UIMatch } from 'react-router-dom';
import type { AgnosticRouteObject } from '@remix-run/router';

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

export type LazyRouteObject<R extends AgnosticRouteObject = RouteObject> = Awaited<ReturnType<LazyRouteFunction<R>>>;

export function lazyRoute<R extends AgnosticRouteObject>(
  loader: () => Promise<
    | Awaited<object>
    | {
        default: any;
      }
    | { route: object }
  >,
): LazyRouteFunction<R> {
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
