import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';

export function createHelperRoute() {
  const app = new OpenAPIHono();

  const PingRequestParamsSchema = z.object({
    component: z.string().optional(),
  });
  const PingResponseSchema = z.object({
    message: z.string(),
    ok: z.boolean(),
    now: z.number(),
  });

  app.openapi(
    createRoute({
      method: 'get',
      path: '/ping',
      request: {
        params: PingRequestParamsSchema,
      },
      responses: {
        200: {
          content: {
            'application/json': {
              schema: PingResponseSchema,
            },
          },
          description: 'PING',
        },
      },
    }),
    (c) => {
      const { component } = c.req.valid('param');
      return c.json({
        message: `${component || 'PONG'}`,
        now: Math.floor(Date.now() / 1000),
        ok: true,
      });
    },
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/live',
      responses: {
        200: {
          content: {
            'text/plain': {
              schema: z.object({
                ok: z.boolean(),
              }),
            },
          },
          description: 'Live',
        },
      },
    }),
    (c) => {
      return c.json({
        ok: true,
      });
    },
  );

  return app;
}
