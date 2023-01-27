import { createPingQuery } from 'common/src/trpc/handlers';
import { publicProcedure, router } from '../trpc';
import { dataRouter } from './data/dataRouter';
import { githubRouter } from './github/githubRouter';
import { toolRouter } from './github/toolRouter';
import { hashRouter } from './hashRouter';
import { passwordRouter } from './passwordRouter';

export const appRouter = router({
  password: passwordRouter,
  hash: hashRouter,
  data: dataRouter,
  github: githubRouter,
  tool: toolRouter,
  ping: createPingQuery(publicProcedure),
});

export type AppRouter = typeof appRouter;
