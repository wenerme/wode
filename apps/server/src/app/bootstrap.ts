import 'reflect-metadata';
import { type INestApplication, Logger, type NestApplicationOptions } from '@nestjs/common';
import { type AbstractHttpAdapter, NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { type MaybePromise } from '@wener/utils';
import { setAppContext } from './app.context';

export interface BootstrapOptions<T extends INestApplication> {
  name: string;
  module: any;

  httpAdapter?: AbstractHttpAdapter;
  options?: NestApplicationOptions;
  onAfterBootstrap?: (app: T) => MaybePromise<void>;
}

export async function bootstrap<T extends INestApplication>({
  name,
  module,
  httpAdapter = new FastifyAdapter(), // 似乎必须需要 httpAdapter 存在
  options,
  onAfterBootstrap,
}: BootstrapOptions<T>): Promise<T> {
  const log = new Logger('Bootstrap');

  log.log(`bootstrapping: ${name}`);

  let app: T;
  if (httpAdapter) {
    app = await NestFactory.create<T>(module, httpAdapter, options);
  } else {
    app = await NestFactory.create(module);
  }

  setAppContext(app);
  await onAfterBootstrap?.(app);
  return app as T;
}
