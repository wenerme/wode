import type { LoggerWithChild, LogLevel } from './Logger';

export function createLogger(
  write: (o: { level: LogLevel; values: any[] } & Record<string | symbol, any>) => void = ({
    level,
    values,
    ...ctx
  }) => {
    ({ values, ...ctx } = merge(ctx, values));
    console[level]?.(...values, ctx);
  },
  context: object = {},
): LoggerWithChild {
  return {
    trace: (...values) => {
      write({ ...context, level: 'trace', values });
    },
    debug: (...values) => {
      write({ ...context, level: 'debug', values });
    },
    info: (...values) => {
      write({ ...context, level: 'info', values });
    },
    warn: (...values) => {
      write({ ...context, level: 'warn', values });
    },
    error: (...values) => {
      write({ ...context, level: 'error', values });
    },
    child: (ctx) => createLogger(write, { ...context, ...ctx }),
  };
}

// logger.info({name:'wener'},'message')
// merge initial context with message object
function merge(ctx: any, values: any[]) {
  if (values[0] && typeof values[0] === 'object') {
    return { ...ctx, ...values[0], values: values.slice(1) };
  }
  return { ...ctx, values };
}
