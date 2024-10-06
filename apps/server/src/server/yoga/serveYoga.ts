import type { MiddlewareHandler } from 'hono';

export function serveYoga({
  yoga,
  sseEndpoint,
}: {
  yoga: {
    fetch: (req: Request, ...args: any[]) => Promise<Response> | Response;
  };
  sseEndpoint?: string;
}): MiddlewareHandler {
  return async (c, next) => {
    if (c.finalized) {
      return next();
    }
    let req = c.req.raw;

    if (sseEndpoint) {
      let accept = req.headers.get('accept');
      if (accept && !accept.includes('application/json') && accept.includes('text/event-stream')) {
        let u = new URL(req.url);
        if (u.pathname.startsWith(sseEndpoint)) {
          u.pathname = sseEndpoint;
          req = new Request(u, req);
        }
      }
    }

    // for non-node
    // return yoga.fetch(c.req.raw, c.env, c.executionCtx);

    return yoga.fetch(req, c.env);
  };
}
