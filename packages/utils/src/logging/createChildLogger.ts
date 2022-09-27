import { Logger, LoggerWithChild } from './Logger';
import { createWriteLogger } from './createWriteLogger';

export function createChildLogger(l: Logger, ctx: object): LoggerWithChild {
  if (l.child) {
    return l.child(ctx) as LoggerWithChild;
  }
  return createWriteLogger((o) => {
    const { level, values, ...c } = o;
    if (Object.keys(c).length) {
      l[level](c, ...values);
    } else {
      l[level](...values);
    }
  }, ctx);
}
