import superjson from 'superjson';
import { initTRPC } from '@trpc/server';

export function createTRPC<C extends Record<string, any>, M extends Record<string, any>>() {
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
