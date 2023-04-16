import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { type PostgreSqlDriver } from '@mikro-orm/postgresql';
import { type INestApplicationContext, Logger, type Type } from '@nestjs/common';

const log = new Logger('ApplicationContext');

let _context: INestApplicationContext;
// let _$context: Promise<INestApplicationContext>;
// export function bootstrap() {
//   // 避免 race condition
//   if (_$context) {
//     return _$context;
//   }
//   return (_$context = Promise.resolve().then(async () => {
//     // 避免循环依赖
//     const { AppModule } = await import('./app.module');
//     _context = await NestFactory.createApplicationContext(AppModule, {
//       logger: false,
//     });
//     await _context.init();
//     log.log(`boostrap done`);
//     return _context;
//   }));
// }

export function setAppContext(ctx: INestApplicationContext) {
  _context = ctx;
  // _$context = Promise.resolve(ctx);
  log.log(`setAppContext`);
}

export function getAppContext() {
  if (!_context) {
    throw new Error(`appContext is not ready`);
  }
  return _context;
}

export function getContext<TInput = any, TResult = TInput>(
  typeOrToken: Type<TInput> | Function | string | symbol,
): TResult {
  const out = getAppContext().get(typeOrToken);
  if (!out) {
    log.warn(`getService(${String(typeOrToken)}) not found`);
  }
  return out as any;
}

export function getMikroORM() {
  return getContext(MikroORM<PostgreSqlDriver>);
}
