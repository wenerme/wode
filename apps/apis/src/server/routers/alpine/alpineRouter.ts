import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { getFlagged } from './getFlagged';

export const alpineRouter = router({
  pkg: router({
    flagged: publicProcedure
      .meta({ openapi: { method: 'GET', path: '/alpine/pkg/flagged' } })
      .input(z.object({}))
      .output(z.object({}).passthrough().array())
      .query(async () => {
        return await getFlagged();
      }),
  }),
});
