import { createPingQuery } from 'common/src/trpc/handlers';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { passwordRouter } from './passwordRouter';

export const appRouter = router({
  password: passwordRouter,
  ping: createPingQuery(publicProcedure),
});

export type AppRouter = typeof appRouter;
