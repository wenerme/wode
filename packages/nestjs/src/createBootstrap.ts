import { type INestApplicationContext, Logger, type LoggerService, type LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { MaybePromise } from '@wener/utils';
import { setAppContext } from './context';

export interface NestApplicationContextOptions {
  /**
   * Specifies the logger to use.  Pass `false` to turn off logging.
   */
  logger?: LoggerService | LogLevel[] | false;
  /**
   * Whether to abort the process on Error. By default, the process is exited.
   * Pass `false` to override the default behavior. If `false` is passed, Nest will not exit
   * the application and instead will rethrow the exception.
   * @default true
   */
  abortOnError?: boolean | undefined;
  /**
   * If enabled, logs will be buffered until the "Logger#flush" method is called.
   * @default false
   */
  bufferLogs?: boolean;
  /**
   * If enabled, logs will be automatically flushed and buffer detached when
   * application initialization process either completes or fails.
   * @default true
   */
  autoFlushLogs?: boolean;
  /**
   * Whether to run application in the preview mode.
   * In the preview mode, providers/controllers are not instantiated & resolved.
   *
   * @default false
   */
  preview?: boolean;
  /**
   * Whether to generate a serialized graph snapshot.
   *
   * @default false
   */
  snapshot?: boolean;
}

/**
 * create a bootstrap function for createApplicationContext, allowed to call multiple times
 */
export function createBootstrap({
  module,
  options,
  onBootstrap,
}: {
  module: any;
  options?: NestApplicationContextOptions;
  onBootstrap?: (ctx: INestApplicationContext) => MaybePromise<void>;
}) {
  let _context: INestApplicationContext;
  let _$context: Promise<INestApplicationContext> | undefined;
  const log = new Logger('Bootstrap');

  function bootstrap() {
    // avoid race
    if (_$context) {
      return _$context;
    }
    let start = Date.now();
    return (_$context = Promise.resolve().then(async () => {
      _context = await NestFactory.createApplicationContext(module, options);
      setAppContext(_context);
      await _context.init();
      await onBootstrap?.(_context);
      log.log(`started in ${Date.now() - start}ms`);
      return _context;
    }));
  }

  return bootstrap;
}
