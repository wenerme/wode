import type { MiddlewareHandler } from 'hono';
import { runContext } from '@/server/context';

export function createHonoContext(): MiddlewareHandler {
	return async (_, next) => {
		return runContext(next);
	};
}
