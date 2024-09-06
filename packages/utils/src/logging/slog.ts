import type { Logger, LogLevel } from './Logger';

enum Level {
  trace = -8,
  debug = -4,
  info = 0,
  warn = 4,
  error = 8,
}

interface LogRecord {
  time?: Date;
  message: string;
  level?: 'info' | 'debug' | 'warn' | 'error' | 'trace';
  attrs?: Record<string, any>;

  source?: {
    func?: string;
    file?: string;
    line?: number;
  };

  // https://cs.opensource.google/go/x/exp/+/d63ba01a:slog/record.go
}

type LogFunc =
  | ((message: string) => void)
  | ((message: string, attrs: Record<string, any>) => void)
  | ((message: string, key: string, value: any, ...attrs: any[]) => void);

function createLogFunc(opts: {
  onRecord: (rec: LogRecord) => void;
  attrs?: Record<string, any>;
  level?: LogLevel;
}): LogFunc {
  return (msg: string, ...args: any[]) => {
    const rec = {
      message: String(msg),
      level: opts.level,
      attrs: Object.assign({}, opts.attrs),
    };

    if (args[0] && typeof args[0] === 'object') {
      rec.attrs = Object.assign(rec.attrs, args[0]);
    } else {
      for (let i = 0; i < args.length; i += 2) {
        rec.attrs[String(args[i])] = args[i + 1];
      }
    }

    opts.onRecord(rec);
  };
}

function stringify(rec: LogRecord, opts: { level?: boolean } = {}) {
  const sb = [];
  if (rec.time) {
    sb.push(rec.time.toJSON());
  }
  rec.level && opts.level !== false && sb.push(rec.level.toUpperCase().padStart(5, ' '));
  sb.push(rec.message);

  if (rec.attrs) {
    for (let [key, value] of Object.entries(rec.attrs)) {
      sb.push(`${key}=${JSON.stringify(value)}`);
    }
  }
  return sb.join(' ');
}

export function createLogger(
  opts: { writer?: (record: LogRecord) => void; level?: LogLevel; time?: boolean } = {},
): Logger {
  opts.time ??= typeof window === 'undefined';
  const onRecord = (record: LogRecord) => {
    // can change options after create
    const { writer = createLogger.writer, level, time } = opts;
    if (level) {
      if (Level[level] < Level[record.level!]) {
        return;
      }
    }
    if (time) {
      record.time = new Date();
    }
    writer(record);
  };
  return {
    trace: createLogFunc({ onRecord, level: 'trace' }),
    debug: createLogFunc({ onRecord, level: 'debug' }),
    info: createLogFunc({ onRecord, level: 'info' }),
    warn: createLogFunc({ onRecord, level: 'warn' }),
    error: createLogFunc({ onRecord, level: 'error' }),
  };
}

createLogger.writer = (record: LogRecord) => {
  const { level } = record;
  console[level || 'info'](stringify(record));
};

// https://github.com/alexeyraspopov/picocolors/blob/main/picocolors.js
/*
MDN: Styling console output
https://developer.mozilla.org/en-US/docs/Web/API/console#Usage

Chrome: Console API Reference
https://developers.google.com/web/tools/chrome-devtools/console/console-write#styling_console_output_with_css

WebKit: Console Object API
https://webkit.org/web-inspector/console-object-api/

https://stackoverflow.com/questions/7505623

console.log('\x1b[36m Hello \x1b[34m Colored \x1b[35m World!');
console.log('\x1B[31mHello\x1B[34m World');
console.log('\x1b[43mHighlighted');


NestJS Formatter
https://github.com/nestjs/nest/blob/d4bda940fc10238eb18f14ebf66d66b7ef8bff41/packages/common/services/console-logger.service.ts#L201-L227

 */

export type Formatter = (input: string | number | null | undefined) => string;

export interface Colors {
  isColorSupported: boolean;
  reset: Formatter;
  bold: Formatter;
  dim: Formatter;
  italic: Formatter;
  underline: Formatter;
  inverse: Formatter;
  hidden: Formatter;
  strikethrough: Formatter;
  black: Formatter;
  red: Formatter;
  green: Formatter;
  yellow: Formatter;
  blue: Formatter;
  magenta: Formatter;
  cyan: Formatter;
  white: Formatter;
  gray: Formatter;
  bgBlack: Formatter;
  bgRed: Formatter;
  bgGreen: Formatter;
  bgYellow: Formatter;
  bgBlue: Formatter;
  bgMagenta: Formatter;
  bgCyan: Formatter;
  bgWhite: Formatter;
}

let formatter =
  (open: string, close: string, replace: string = open) =>
  (input: string) => {
    let string = '' + input;
    let index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };

let replaceClose = (string: string, close: string, replace: string, index: number): string => {
  let start = string.substring(0, index) + replace;
  let end = string.substring(index + close.length);
  let nextIndex = end.indexOf(close);
  return ~nextIndex ? start + replaceClose(end, close, replace, nextIndex) : start + end;
};

function getEnv(): Record<string, string | undefined> {
  if (typeof process === 'object') {
    return process.env;
  }
  return {};
}

function isColorSupported() {
  if (typeof window === 'object') {
    return true;
  }
  const env = getEnv();
  if ('NO_COLOR' in env) {
    return false;
  }
  if ('FORCE_COLOR' in env || 'CI' in env) {
    return true;
  }
  return false;
}

export function createConsoleColors(enabled = isColorSupported()) {
  return {
    isColorSupported: enabled,
    reset: enabled ? (s: string) => `\x1b[0m${s}\x1b[0m` : String,
    bold: enabled ? formatter('\x1b[1m', '\x1b[22m', '\x1b[22m\x1b[1m') : String,
    dim: enabled ? formatter('\x1b[2m', '\x1b[22m', '\x1b[22m\x1b[2m') : String,
    italic: enabled ? formatter('\x1b[3m', '\x1b[23m') : String,
    underline: enabled ? formatter('\x1b[4m', '\x1b[24m') : String,
    inverse: enabled ? formatter('\x1b[7m', '\x1b[27m') : String,
    hidden: enabled ? formatter('\x1b[8m', '\x1b[28m') : String,
    strikethrough: enabled ? formatter('\x1b[9m', '\x1b[29m') : String,
    black: enabled ? formatter('\x1b[30m', '\x1b[39m') : String,
    red: enabled ? formatter('\x1b[31m', '\x1b[39m') : String,
    green: enabled ? formatter('\x1b[32m', '\x1b[39m') : String,
    yellow: enabled ? formatter('\x1b[33m', '\x1b[39m') : String,
    blue: enabled ? formatter('\x1b[34m', '\x1b[39m') : String,
    magenta: enabled ? formatter('\x1b[35m', '\x1b[39m') : String,
    cyan: enabled ? formatter('\x1b[36m', '\x1b[39m') : String,
    white: enabled ? formatter('\x1b[37m', '\x1b[39m') : String,
    gray: enabled ? formatter('\x1b[90m', '\x1b[39m') : String,
    bgBlack: enabled ? formatter('\x1b[40m', '\x1b[49m') : String,
    bgRed: enabled ? formatter('\x1b[41m', '\x1b[49m') : String,
    bgGreen: enabled ? formatter('\x1b[42m', '\x1b[49m') : String,
    bgYellow: enabled ? formatter('\x1b[43m', '\x1b[49m') : String,
    bgBlue: enabled ? formatter('\x1b[44m', '\x1b[49m') : String,
    bgMagenta: enabled ? formatter('\x1b[45m', '\x1b[49m') : String,
    bgCyan: enabled ? formatter('\x1b[46m', '\x1b[49m') : String,
    bgWhite: enabled ? formatter('\x1b[47m', '\x1b[49m') : String,
  };
}
