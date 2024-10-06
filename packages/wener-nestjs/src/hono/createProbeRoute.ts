import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { MaybePromise } from '@wener/utils';
import { z } from 'zod';

export function createProbeRoute({
  ready,
  live,
}: {
  ready?: () => MaybePromise<void>;
  live?: () => MaybePromise<void>;
} = {}) {
  const app = new OpenAPIHono();

  app.openapi(
    createRoute({
      method: 'get',
      path: '/ready',
      responses: {
        200: {
          content: {
            'text/plain': {
              schema: z.object({
                ok: z.boolean(),
              }),
            },
          },
          description: 'Ready',
        },
      },
    }),
    async (c) => {
      try {
        await ready?.();
      } catch (e) {
        c.status(500);
        return c.json({
          ok: false,
        });
      }
      return c.json({
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
    async (c) => {
      try {
        await live?.();
      } catch (e) {
        c.status(500);
        return c.json({
          ok: false,
        });
      }
      return c.json({
        ok: true,
      });
    },
  );

  return app;
}
