import type { MiddlewareHandler } from 'hono';
import { runContext } from '@/server/utils/runContext';

export function withHonoContext(): MiddlewareHandler {
  return async (_, next) => {
    return runContext(next);
  };
}
