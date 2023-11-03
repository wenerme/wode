import 'reflect-metadata';
import { type INestApplication, INestApplicationContext, Logger, type NestApplicationOptions } from '@nestjs/common';
import { type AbstractHttpAdapter, NestFactory } from '@nestjs/core';
import { setAppContext } from '@wener/nestjs';
import { App } from '@wener/nestjs/app';
import { type MaybePromise } from '@wener/utils';

export interface MicroserviceOptions extends Record<string, any> {}

export interface BootstrapOptions<T extends INestApplication> {
  name?: string;
  module: any;

  http?: AbstractHttpAdapter | false;
  microservice?: MicroserviceOptions;
  options?: NestApplicationOptions;
  onAfterBootstrap?: (app: T) => MaybePromise<void>;
}

export async function bootstrap<T extends INestApplication>({
  name = App.service,
  module,
  http,
  microservice,
  options,
  onAfterBootstrap,
}: BootstrapOptions<T>): Promise<T> {
  const log = new Logger('Bootstrap');

  log.log(`bootstrapping: ${name}`);

  let out: INestApplicationContext;
  let app: INestApplication;
  if (http) {
    app = await NestFactory.create<T>(module, http, options);
    if (microservice) {
      app.connectMicroservice<MicroserviceOptions>(microservice);
    }
    out = app;
  } else if (microservice) {
    out = await NestFactory.createMicroservice<MicroserviceOptions>(module, microservice);
  } else {
    app = await NestFactory.create(module);
    out = app;
  }

  setAppContext(out);
  await onAfterBootstrap?.(out as T);
  return out as T;
}
