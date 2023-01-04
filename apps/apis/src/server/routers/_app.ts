import { createPingQuery } from 'common/src/trpc/handlers';
import { publicProcedure, router } from '../trpc';
import { hashRouter } from './hashRouter';
import { passwordRouter } from './passwordRouter';

export const appRouter = router({
  password: passwordRouter,
  hash: hashRouter,
  ping: createPingQuery(publicProcedure),
});

export type AppRouter = typeof appRouter;
