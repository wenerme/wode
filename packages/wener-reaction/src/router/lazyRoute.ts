import type { LazyRouteFunction, RouteObject } from 'react-router-dom';

export type LazyRouteObject<R extends RouteObject = RouteObject> = Awaited<ReturnType<LazyRouteFunction<R>>>;

export function lazyRoute<R extends RouteObject = RouteObject>(
	loader: () => Promise<Awaited<object> | { default: any } | { route: object }>,
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
