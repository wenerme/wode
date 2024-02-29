import process from 'node:process';
import { HttpBindings } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createHelperRoute } from '@src/poc/alpine/createHelperRoute';
import { Errors, loadEnvs } from '@wener/nestjs';
import { resolveServerError } from '@wener/server/src/apps/openai-proxy/resolveErrorDetail';
import { MaybePromise } from '@wener/utils';
import { Hono } from 'hono';
import { showRoutes } from 'hono/dev';
import { logger } from 'hono/logger';

export interface RunHonoServerOptions<T extends Hono<any>> {
  port?: number;
  app?: T;
  createApp?: () => T;
  onApp?: (app: T) => MaybePromise<T>;
  onServe?: (arg: { port: number; address: string }) => void;
}

export async function runHonoServer<T extends Hono<any>>(opts: RunHonoServerOptions<T>) {
  let app = opts.app;
  const {
    createApp = () => {
      let app = new Hono<{ Bindings: Bindings }>() as T;
      app.use(logger());
      return app;
    },
    onApp = (v) => v,
    onServe = ({ port, address }) => {
      showRoutes(app!);
      console.log(`Listening on http://${address}:${port}`); // Listening on http://localhost:3000
    },
  } = opts;

  await loadEnvs();

  type Bindings = HttpBindings & {
    /* ... */
  };

  app ||= createApp();
  app = await onApp(app);

  let { port = process.env.PORT } = opts;
  serve(
    {
      fetch: app.fetch,
      port: typeof port === 'string' ? parseInt(port) : port,
    },
    onServe,
  );
}

export async function serve(
  o: {
    fetch: (request: Request) => MaybePromise<Response>;
    port?: number;
  },
  cb: (o: { address: string; port: number }) => void,
) {
  let serve;
  if (process.release.name === 'node') {
    ({ serve } = await import('@hono/node-server'));
  } else if (process.release.name === 'bun') {
    serve = ({ fetch, port }: { fetch: (req: Request) => MaybePromise<Response>; port?: number }, cb: Function) => {
      (globalThis as any).Bun.serve({
        fetch,
        port,
      });
    };
  } else {
    serve = () => {
      throw new Error(`Unsupported platform: ${process.release.name}`);
    };
  }

  return serve(o, cb);
}

export function createOpenAPIHono() {
  type Bindings = HttpBindings & {};
  const app = new OpenAPIHono<{ Bindings: Bindings }>();
  app.use(logger());

  app.route('/api', createHelperRoute());

  app.onError((err, c) => {
    process.env.NODE_ENV === 'development' && console.error(err);
    let details = resolveServerError(err);
    if (details) {
      return Errors.with(details).asResponse();
    }
    return Errors.resolve(err).asResponse();
  });

  app.doc('/api/openapi.json', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'API',
    },
  });
  app.use('*', serveStatic({ root: './public' }));

  return app;
}
