import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import type { Context, MiddlewareHandler } from 'hono';
import { runAccessTokenInterceptor } from '@/foundation/Auth/actions/runAccessTokenInterceptor';

export function createHonoAuth({
	log = consola,
	allowBasicAuth,
}: {
	log?: ConsolaInstance;
	allowBasicAuth?: (ctx: Context) => boolean;
} = {}): MiddlewareHandler {
	return async (c, next) => {
		await runAccessTokenInterceptor({
			req: c.req.raw,
			log,
			allowBasicAuth: () => {
				return allowBasicAuth?.(c) ?? false;
			},
		});

		return next();
	};
}
