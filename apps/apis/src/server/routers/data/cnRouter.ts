import { requireFound } from 'common/src/trpc/handlers';
import { z } from 'zod';
import { parseDivisionCode } from '@wener/data/cn';
import { publicProcedure, router } from '../../trpc';

export const cnRouter = router({
  division: router({
    search: publicProcedure
      .meta({ openapi: { method: 'GET', path: '/data/cn/division/_search' } })
      .input(
        z.object({
          query: z.string(),
        }),
      )
      .output(z.object({}).passthrough().array())
      .query(async ({ input: { query } }) => {
        let all = await getDivisions();
        let out = [];
        for (let [k, v] of Object.entries(all)) {
          if (k.includes(query) || (v as string).includes(query)) {
            out.push(parseDivisionCode(all, k));
          }
          if (out.length >= 50) {
            break;
          }
        }
        return out as any;
      }),
    get: publicProcedure
      .meta({ openapi: { method: 'GET', path: '/data/cn/division/{code}' } })
      .input(
        z.object({
          code: z.string(),
        }),
      )
      .output(z.object({}).passthrough())
      .query(async ({ input: { code } }) => {
        const divisions = await getDivisions();
        return requireFound(parseDivisionCode(divisions, code));
      }),
  }),
});

let Divisions;

export async function getDivisions() {
  return (Divisions ||= await import('@wener/data/cn/division/divisions.json').then((v) => v.default));
}
