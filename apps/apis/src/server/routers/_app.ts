import { createPingQuery } from 'common/src/trpc/handlers';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const appRouter = router({
  ping: createPingQuery(publicProcedure),
});

export type AppRouter = typeof appRouter;
