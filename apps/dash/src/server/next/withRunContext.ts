import { runContext } from '../runContext';
import type { NextRouteHandler } from './withNextRouteHandler';

export function withRunContext(next: NextRouteHandler): NextRouteHandler {
  return (...args) => {
    return runContext(() => next(...args));
  };
}
