import { LoggerWithChild } from './Logger';

export function createNoopLogger(): LoggerWithChild {
  const noop = (..._: any[]) => undefined;
  return {
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: () => createNoopLogger(),
  };
}
