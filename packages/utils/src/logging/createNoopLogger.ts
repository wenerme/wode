import { LoggerWithChild } from './Logger';

export function createNoopLogger(): LoggerWithChild {
  const noop = (..._: any[]) => void 0;
  return {
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: () => createNoopLogger(),
  };
}
