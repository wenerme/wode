import 'reflect-metadata';
import { type INestApplicationContext, Logger, type Type } from '@nestjs/common';

const log = new Logger('ApplicationContext');

let _context: INestApplicationContext;

export function setAppContext(ctx: INestApplicationContext) {
  _context = ctx;
  // _$context = Promise.resolve(ctx);
  log.log('setAppContext');
}

export function getAppContext() {
  if (!_context) {
    throw new Error('appContext is not ready');
  }

  return _context;
}

export function getContext<TInput = any, TResult = TInput>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  typeOrToken: Type<TInput> | Function | string | symbol,
): TResult {
  const out = getAppContext().get(typeOrToken);
  if (!out) {
    log.warn(`getService(${String(typeOrToken)}) not found`);
  }

  return out as any;
}
