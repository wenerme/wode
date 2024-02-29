import process from 'node:process';
import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Errors } from '@wener/utils';
import { logger } from 'hono/logger';
import { createProbeRoute } from './createProbeRoute';

export function createOpenAPIHono() {
  type Bindings = HttpBindings & {};
  const app = new OpenAPIHono<{ Bindings: Bindings }>();
  app.use(logger());

  app.route('/api', createProbeRoute());

  app.onError((err, c) => {
    process.env.NODE_ENV === 'development' && console.error(err);
    return Errors.resolve(err).asResponse();
  });

  app.doc('/api/openapi.json', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'API',
    },
  });
  // app.use('*', serveStatic({ root: './public' }));

  return app;
}
