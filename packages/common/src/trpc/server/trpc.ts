import { type OpenApiMeta } from 'trpc-openapi';
import { type Context } from './context';
import { createTRPC } from './createTRPC';

const t = createTRPC<Context, OpenApiMeta>();

export const { router, middleware, procedure: publicProcedure, mergeRouters } = t;
