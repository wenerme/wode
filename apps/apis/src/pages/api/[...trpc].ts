import { createOpenApiNextHandler } from 'trpc-openapi';
import { createContext } from '../../server/context';
import { appRouter } from '../../server/routers/_app';

export default createOpenApiNextHandler({
  router: appRouter,
  createContext,
  onError: ({ error, type, path, input, ctx, req }) => {
    console.log(`Got error`, error);
  },
});
