import { initTRPC } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { z } from 'zod';

function createTRPC<C extends Record<string, any>, M extends Record<string, any>>() {
  return initTRPC
    .context<C>()
    .meta<M>()
    .create({
      transformer: superjson,
      allowOutsideOfServer: process.env.NODE_ENV === 'test',
      isServer: typeof window === 'undefined' || 'Deno' in window || process.env.NODE_ENV === 'test',
      isDev: process.env.NODE_ENV !== 'production',
    });
}

const t = createTRPC();
const { router, procedure: publicProduce } = t;

const appRouter = router({
  hello: publicProduce
    .input(
      z.object({
        text: z.string().nullish(),
      }),
    )
    .query(({ input }) => {
      return {
        greeting: `hello ${input?.text ?? 'world'}`,
      };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
});
