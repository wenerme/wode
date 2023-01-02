import { z } from 'zod';
import { ProcedureBuilder } from '@trpc/server';


export function createPingQuery<P extends ProcedureBuilder<any>>(procedure: P) {
  return procedure
    .meta({ openapi: { method: 'GET', path: '/ping' } })
    .input(
      z.object({
        echo: z.string().optional(),
      }),
    )
    .output(
      z.object({
        now: z.number(),
        message: z.string(),
      }),
    )
    .query(({ input: { echo = 'OK' } }) => {
      return { now: Math.floor(Date.now() / 1000), message: echo };
    });
}
