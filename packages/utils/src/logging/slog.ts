import { Logger, LogLevel } from './Logger';

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
