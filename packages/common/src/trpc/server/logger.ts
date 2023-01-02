import pino from 'pino';
import pretty from 'pino-pretty';

const isDev = process.env.NODE_ENV === 'development';
let _logger;

export function getLogger(name?: string) {
  _logger ||= createLogger();
  if (name) {
    return _logger.child({ c: name });
  }
  return _logger;
}

function createLogger() {
  const multistream = pino.multistream;
  const streams = isDev
    ? ([{ stream: pretty() }] as const)
    : ([{ stream: process.stdout }, { level: 'error', stream: process.stderr }] as const);
  return pino(
    isDev
      ? {
          level: 'debug',
          // mixinMergeStrategy(mergeObject: any, mixinObject: any) {
          //   return Object.assign(mergeObject, mixinObject)
          // },
        }
      : {
          level: 'info',
        },
    multistream(streams as any),
  );
}
