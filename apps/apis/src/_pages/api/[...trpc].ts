import { createOpenApiNextHandler } from 'trpc-openapi';
import { createContext } from '../../server/context';
import { appRouter } from '../../server/routers/_app';
import { withCors } from '../../server/withCors';

export default withCors(
  createOpenApiNextHandler({
    router: appRouter,
    createContext,
    onError: ({ error, type, path, input, ctx, req }) => {
      console.log(`Got error`, error);
    },
  }),
);
