import { getRemoteServerSession } from 'common/src/server';
import { getLogger } from 'common/src/trpc/server/logger';
import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { waitInit } from './waitInit';

export async function createContext(opts: CreateNextContextOptions) {
  await waitInit();

  // const sequelize = await getSequelize();
  const sequelize = undefined;
  const rid = opts.req.headers['x-request-id'];
  const logger = getLogger().child({ rid });

  const session = await getRemoteServerSession(opts);
  let user: ContextUser | undefined;
  if (session?.user) {
    user = { ...session.user } as ContextUser;
  }
  return {
    logger,
    sequelize,
    session,
    user,
  };
}

export interface ContextUser {
  name: string;
  email: string;
  image: string;
  isAdmin?: boolean;
}

export type Context = inferAsyncReturnType<typeof createContext>;
