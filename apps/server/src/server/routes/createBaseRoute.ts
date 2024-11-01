import type { HttpBindings } from '@hono/node-server';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { firstOfMaybeArray } from '@wener/utils';
import { mapValues } from 'es-toolkit';
import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { UAParser } from 'ua-parser-js';
import { z } from 'zod';

export function createBaseRoute() {
  const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

  app.openapi(
    createRoute({
      description: 'Ping',
      method: 'get',
      path: '/ping',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                now: z.string(),
              }),
            },
          },
          description: 'Ping',
        },
      },
    }),
    (c) => {
      return c.json({
        success: true,
        now: new Date(),
      });
    },
  );

  app.openapi(
    createRoute({
      description: 'Get IP',
      method: 'get',
      path: '/ip',
      responses: {
        200: {
          content: {
            'text/plain': {
              schema: z.string(),
            },
          },
          description: 'Get IP',
        },
      },
    }),
    (c) => {
      let hdr = c.req.header();
      const ip = hdr['x-forwarded-for'] || hdr['cf-connecting-ip'] || c.env.incoming.socket?.remoteAddress;
      return c.text(firstOfMaybeArray(ip)?.split(',')?.[0].trim() ?? '');
    },
  );

  {
    const WhoAmiIRoute = createRoute({
      method: 'get',
      path: '/whoami',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: z.object({
                method: z.string(),
                query: z.record(z.string()),
                queries: z.record(z.any()),
                cookies: z.any(),
                headers: z.record(z.any()),
                body: z.any(),
                ua: z.any(),
              }),
            },
          },
          description: 'Who Am I',
        },
      },
    });

    let handleWhoAmiI: MiddlewareHandler = async (c) => {
      let hdr = c.req.header();
      let body = null;

      let ct = hdr['content-type'];
      if (ct?.includes('application/json')) {
        body = await c.req.json();
      } else if (ct?.includes('application/x-www-form-urlencoded')) {
        // body = await c.req.formData();
        body = Array.from(new URLSearchParams(await c.req.text()).entries()).reduce(
          (acc, [k, v]) => {
            let prev = acc[k];
            if (prev) {
              if (!Array.isArray(prev)) {
                acc[k] = [prev];
              }
              acc[k].push(v);
            } else {
              acc[k] = v;
            }
            return acc;
          },
          {} as Record<string, any>,
        );
      } else if (ct?.includes('text/plain')) {
        body = await c.req.text();
      }

      return c.json({
        // url: c.req.url,
        method: c.req.method,
        query: c.req.query(),
        queries: mapValues(c.req.queries(), (v) => {
          return v.length > 1 ? v : v[0];
        }),
        cookies: getCookie(c),
        // body: c.req.body,
        headers: hdr,
        body,
        ua: new UAParser(hdr['user-agent']).getResult(),
      });
    };

    app.openAPIRegistry.registerPath(WhoAmiIRoute);
    app.all(WhoAmiIRoute.path, handleWhoAmiI);
  }
  return app;
}
