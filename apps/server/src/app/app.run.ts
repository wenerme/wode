import 'reflect-metadata';
import helmet from '@fastify/helmet';
import { Logger } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadEnvs } from '../util/loadEnvs';
import { bootstrap, type BootstrapOptions } from './bootstrap';
import { getStaticRootPath } from './util/getStaticRootPath';

const log = new Logger('RunApplication');

export interface ApplicationOptions extends BootstrapOptions {
  openapi?: boolean | ((builder: DocumentBuilder) => void);
}

export async function runApplication(opts: ApplicationOptions) {
  await loadEnvs();
  const app: NestFastifyApplication = await bootstrap({ ...opts, httpAdapter: new FastifyAdapter(), options: {} });

  const { openapi = true } = opts;
  if (openapi) {
    const builder = new DocumentBuilder()
      .setTitle('API')
      .setDescription('API description')
      .setVersion('1.0.0')
      .addServer('http://localhost:3000')
      .addServer('http://127.0.0.1:3000');
    typeof openapi === 'function' && openapi(builder);
    const config = builder.build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const staticRootPath = getStaticRootPath();
  log.log(`staticRootPath: ${staticRootPath}`);
  app.useStaticAssets({
    root: staticRootPath,
  });

  log.log(`HttpAdapter: ${app.getHttpAdapter().constructor.name}`);
  // https://docs.nestjs.com/security/helmet#use-with-fastify
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  app.enableCors({});

  const port = 3000;
  await app.listen(port, '0.0.0.0');
  log.log(`Server started http://localhost:${port}`);
  return app;
}
