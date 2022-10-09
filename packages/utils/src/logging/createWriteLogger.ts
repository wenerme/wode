import type { LoggerWithChild, LogLevel } from './Logger';

export function createWriteLogger(
  write: (o: { level: LogLevel; values: any[] } & Record<string | symbol, any>) => void,
  context: object = {},
): LoggerWithChild {
  return {
    trace: (...values) => write({ ...context, level: 'trace', values }),
    debug: (...values) => write({ ...context, level: 'debug', values }),
    info: (...values) => write({ ...context, level: 'info', values }),
    warn: (...values) => write({ ...context, level: 'warn', values }),
    error: (...values) => write({ ...context, level: 'error', values }),
    child: (ctx) => createWriteLogger(write, { ...context, ...ctx }),
  };
}
