import process from 'node:process';
import type { HttpBindings } from '@hono/node-server';
import { Errors } from '@wener/utils';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

export function createHono() {
  type Bindings = HttpBindings & {
    /* ... */
  };
  let app = new Hono<{ Bindings: Bindings }>();
  app.use(logger());
  app.onError((err) => {
    process.env.NODE_ENV === 'development' && console.error(err);
    return Errors.resolve(err).asResponse();
  });
  return app;
}
