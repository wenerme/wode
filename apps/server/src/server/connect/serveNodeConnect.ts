import {
  createConnectRouter,
  type ConnectRouter,
  type ConnectRouterOptions,
  type ContextValues,
} from '@connectrpc/connect';
import { universalRequestFromNodeRequest, universalResponseToNodeResponse } from '@connectrpc/connect-node';
import type { UniversalHandler } from '@connectrpc/connect/protocol';
import type { HttpBindings } from '@hono/node-server';
import type { Handler } from 'hono';

export function serveNodeConnect(
  options: ConnectRouterOptions & {
    routes: (router: ConnectRouter) => void;
    prefix?: string;
    contextValues?: (req: any) => ContextValues;
  },
): Handler<{ Bindings: HttpBindings }> {
  const router = createConnectRouter(options);
  options.routes(router);

  const prefix = options.prefix ?? '/api';
  const paths = new Map<string, UniversalHandler>();
  for (const uHandler of router.handlers) {
    paths.set(prefix + uHandler.requestPath, uHandler);
  }

  return async (c) => {
    const requestPath = c.req.path;
    const hdr = paths.get(requestPath);
    if (!hdr) {
      return c.notFound();
    }

    try {
      const res = await hdr(
        universalRequestFromNodeRequest(
          c.env.incoming,
          c.env.outgoing,
          c.req.raw.body as any,
          options.contextValues?.(c),
        ),
      );
      await universalResponseToNodeResponse(res, c.env.outgoing);
    } catch (e) {
      console.error(`handler for rpc ${hdr.method.name} of ${hdr.service.typeName} failed`, e);
    }
  };
}
