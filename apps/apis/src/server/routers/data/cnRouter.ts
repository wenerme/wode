import { requireFound } from 'common/src/trpc/handlers';
import { z } from 'zod';
import { getDivisionTable, ParsedDivisionCode, parseDivisionCode } from '@wener/data/cn/division';
import { loadCounty } from '@wener/data/cn/division/loaders';
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
        await loadCounty();
        let table = getDivisionTable();
        let out = [];
        for (let [code, { name }] of table.entries()) {
          if (name.includes(query)) {
            out.push(parseCode(code)!);
          }
          if (out.length > 10) {
            break;
          }
        }
        return out;
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
        await loadCounty();
        return requireFound(parseCode(code));
      }),
  }),
});

function parseCode(code: string | number) {
  return parseDivisionCode(code);
}
