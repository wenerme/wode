import path from 'node:path';
import 'reflect-metadata';
import fastifyHelmet from '@fastify/helmet';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ms } from '@wener/utils';
import { bootstrap, type BootstrapOptions } from './bootstrap';
import { type ServerConfig } from './config';
import { getStaticRootPath } from './util/getStaticRootPath';

const log = new Logger('RunApplication');

export interface ApplicationOptions extends BootstrapOptions<NestFastifyApplication> {
  openapi?: boolean | ((builder: DocumentBuilder) => void);
}

export async function runApplication(opts: ApplicationOptions) {
  const app: NestFastifyApplication = await bootstrap<NestFastifyApplication>({
    ...opts,

    httpAdapter: new FastifyAdapter({
      // url max 2048, default 100
      // https://stackoverflow.com/a/417184/1870054
      maxParamLength: 2000,
    }),
    options: {},
  });

  const cs = app.get(ConfigService);
  const { port = 3000, prefix, origin } = cs.get<ServerConfig>('server') || {};
  if (prefix) {
    log.log(`global prefix: ${prefix}`);
    app.setGlobalPrefix(prefix, {
      exclude: ['actuator/health'],
    });
  }

  const { openapi = true } = opts;
  if (openapi) {
    let servers = [];
    if (process.env.NODE_ENV === 'development') {
      servers.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
    }
    if (origin) {
      servers.push(origin);
    }
    const builder = new DocumentBuilder().setTitle('API').setDescription('API description').setVersion('1.0.0');

    if (prefix) {
      servers = servers.map((s) => s + prefix);
      // builder.setBasePath(prefix);
    }
    servers = Array.from(new Set(servers)).sort();
    servers.forEach((s) => builder.addServer(s));
    if (typeof openapi === 'function') {
      openapi(builder);
    } else {
      builder.addBearerAuth().addBasicAuth().addCookieAuth();
    }
    const config = builder.build();
    // generate shorter path
    const document = SwaggerModule.createDocument(app, config, {
      ignoreGlobalPrefix: true,
    });
    SwaggerModule.setup(path.join(prefix || '', 'api'), app, document);
  }

  const staticRootPath = getStaticRootPath();
  log.log(`staticRootPath: ${staticRootPath}`);
  app.useStaticAssets({
    root: staticRootPath,
    prefix,
  });

  log.log(`HttpAdapter: ${app.getHttpAdapter().constructor.name}`);
  // https://docs.nestjs.com/security/helmet#use-with-fastify
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });
  app.enableCors({});

  await app.listen(port, '0.0.0.0');
  const u = new URL(`http://localhost:${port}`);
  if (prefix) {
    u.pathname = prefix;
  }
  log.log(`Server started ${u} in ${ms(process.uptime() * 1000)}`);
  return app;
}
