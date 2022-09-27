export interface Logger {
  trace(...data: any[]): void;

  debug(...data: any[]): void;

  info(...data: any[]): void;

  warn(...data: any[]): void;

  error(...data: any[]): void;

  child?: (o: object) => Logger;
}

export interface LoggerWithChild extends Logger {
  child: (o: object) => LoggerWithChild;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
