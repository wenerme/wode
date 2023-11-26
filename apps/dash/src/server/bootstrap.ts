import 'reflect-metadata';
import { type INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { setAppContext } from '@wener/nestjs';

const log = new Logger('Bootstrap');

let _context: INestApplicationContext;
let _$context: Promise<INestApplicationContext> | undefined;

export function bootstrap() {
  // 避免 race condition
  if (_$context) {
    return _$context;
  }
  return (_$context = Promise.resolve().then(async () => {
    // 避免循环依赖
    const { AppModule } = await import('./app.module');
    _context = await NestFactory.createApplicationContext(AppModule, {
      // logger: false,
    });
    setAppContext(_context);
    await _context.init();
    log.log(`boostrap done`);
    return _context;
  }));
}
