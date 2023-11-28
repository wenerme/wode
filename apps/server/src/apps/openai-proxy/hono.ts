import { MiddlewareHandler } from 'hono';
import { getRuntimeKey } from './runtime';

type ServeStaticOptions = {
  root?: string;
  path?: string;
  index?: string; // nodejs
  rewriteRequestPath?: (path: string) => string;
};
let serveStatic: (options?: ServeStaticOptions) => MiddlewareHandler;
let serve;

let type = process.env.RUNTIME_TYPE || getRuntimeKey();
switch (type) {
  case 'bun':
    ({ serveStatic } = await import('hono/bun'));
    serve = Bun.serve;
    break;
  case 'node':
    ({ serveStatic } = await import('@hono/node-server/serve-static'));
    ({ serve } = await import('@hono/node-server'));
    break;
}
export { serveStatic, serve };
