import type { ReactNode } from 'react';
import type { LazyRouteFunction, RouteObject, UIMatch } from 'react-router-dom';

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

export type LazyRouteObject<R extends RouteObject = RouteObject> = Awaited<ReturnType<LazyRouteFunction<R>>>;

export function lazyRoute(
  loader: () => Promise<
    | Awaited<object>
    | {
        default: any;
      }
    | { route: object }
  >,
): LazyRouteFunction<RouteObject> {
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
