import path from 'node:path';
import 'reflect-metadata';
import helmet from '@fastify/helmet';
import { Logger } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ms } from '@wener/utils';
import { bootstrap, type BootstrapOptions } from './bootstrap';
import { type ServerConfig } from './config/server.config';
import { getStaticRootPath } from './util/getStaticRootPath';

const log = new Logger('RunApplication');

export interface ApplicationOptions extends BootstrapOptions {
  openapi?: boolean | ((builder: DocumentBuilder) => void);
}

export async function runApplication(opts: ApplicationOptions) {
  const app: NestFastifyApplication = await bootstrap({ ...opts, httpAdapter: new FastifyAdapter(), options: {} });

  const cs = app.get(ConfigService);
  let { port = 3000, prefix } = cs.get<ServerConfig>('server') || {};
  if (prefix) {
    if (!prefix.startsWith('/')) {
      prefix = `/${prefix}`;
    }
  }
  if (prefix) {
    log.log(`global prefix: ${prefix}`);
    app.setGlobalPrefix(prefix, {
      exclude: [{ path: 'actuator', method: RequestMethod.ALL }],
    });
  }

  const { openapi = true } = opts;
  if (openapi) {
    let servers = [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
    const builder = new DocumentBuilder().setTitle('API').setDescription('API description').setVersion('1.0.0');
    if (prefix) {
      servers = servers.map((s) => s + prefix);
      // builder.setBasePath(prefix);
    }
    servers.forEach((s) => builder.addServer(s));
    typeof openapi === 'function' && openapi(builder);
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
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  app.enableCors({});

  await app.init();
  await app.listen(port, '0.0.0.0');
  const u = new URL(`http://localhost:${port}`);
  if (prefix) {
    u.pathname = prefix;
  }
  log.log(`Server started ${u} in ${ms(process.uptime() * 1000)}`);
  return app;
}
