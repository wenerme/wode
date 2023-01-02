import { createTRPC } from 'common/src/trpc/server/createTRPC';
import type { OpenApiMeta } from 'trpc-openapi';
import { TRPCError } from '@trpc/server';
import type { Context } from './context';

const t = createTRPC<Context, OpenApiMeta>();

export const { router, middleware, procedure: publicProcedure, mergeRouters } = t;

const isAuthed = middleware(({ next, ctx }) => {
  // fixme 暂时开发不做认证
  if (process.env.NODE_ENV === 'development') {
    return next({ ctx });
  }
  if (!ctx.user?.isAdmin) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx });
});

export const procedure = publicProcedure.use(isAuthed);
