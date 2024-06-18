import type { LazyRouteFunction, RouteObject } from 'react-router-dom';
import type { AgnosticRouteObject } from '@remix-run/router';

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
