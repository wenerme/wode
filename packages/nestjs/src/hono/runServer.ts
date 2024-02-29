import process from 'node:process';
import { loadEnvs } from '@wener/nestjs';
import { App } from '@wener/nestjs/app';
import { MaybePromise } from '@wener/utils';
import { Hono } from 'hono';
import { showRoutes } from 'hono/dev';
import { createHono } from './createHono';
import { serve } from './serve';

export interface RunHonoServerOptions<T extends Hono<any>> {
  port?: number;
  app?: T;
  createApp?: () => T;
  onApp?: (app: T) => MaybePromise<T>;
  onServe?: (arg: { port: number; address: string }) => void;
  env?: false;
}

export async function runServer<T extends Hono<any>>(opts: RunHonoServerOptions<T>) {
  let app = opts.app;
  const {
    createApp = createHono,
    onApp = (v) => v,
    onServe = ({ port, address }) => {
      showRoutes(app!);
      console.log(`Listening on http://${address}:${port}`); // Listening on http://localhost:3000
    },
  } = opts;

  if (opts.env === false) {
    // skip
  } else {
    await loadEnvs({ name: App.service });
  }

  app ||= createApp() as T;
  app = await onApp(app);

  let { port = process.env.PORT } = opts;
  return serve(
    {
      fetch: app.fetch,
      port: typeof port === 'string' ? parseInt(port) : port,
    },
    onServe,
  );
}
