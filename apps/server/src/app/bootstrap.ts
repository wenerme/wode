import 'reflect-metadata';
import { type INestApplication, Logger, type NestApplicationOptions } from '@nestjs/common';
import { type AbstractHttpAdapter, NestFactory } from '@nestjs/core';
import { MaybePromise } from '@wener/utils';
import { setAppContext } from './app.context';

export interface BootstrapOptions<T extends INestApplication = INestApplication> {
  name: string;
  module: any;

  httpAdapter?: AbstractHttpAdapter;
  options?: NestApplicationOptions;
  onInit?: (app: T) => MaybePromise<void>;
}

export async function bootstrap<T extends INestApplication>({
  name,
  module,
  httpAdapter,
  options,
  onInit,
}: BootstrapOptions): Promise<T> {
  const log = new Logger('Bootstrap');

  log.log(`bootstrapping: ${name}`);

  let app: INestApplication;
  if (httpAdapter) {
    app = await NestFactory.create<T>(module, httpAdapter, options);
  } else {
    app = await NestFactory.create(module);
  }

  setAppContext(app);
  await onInit?.(app);
  return app as T;
}
