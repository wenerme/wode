/**
 * Logger interface satisfies the `console`, `pino` logger interface.
 */
export interface Logger {
  trace(...args: any[]): void;

  debug(...args: any[]): void;

  info(...args: any[]): void;

  warn(...args: any[]): void;

  error(...args: any[]): void;

  /**
   * create child logger with given context
   */
  child?: (o: object) => Logger;
}

export interface LoggerWithChild extends Logger {
  child: (o: Record<string, any>) => LoggerWithChild;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
