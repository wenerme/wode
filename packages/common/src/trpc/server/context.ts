import { IncomingMessage } from 'http';
import ws from 'ws';
import { Sequelize } from '@sequelize/core';
import { MaybePromise } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import { CreateHTTPContextOptions } from '@trpc/server/dist/adapters/standalone';
import { CreateWSSContextFnOptions } from '@trpc/server/dist/adapters/ws';
import { createLazyPromise } from '@wener/utils';
import { polyfillCrypto, polyfillFetch } from '@wener/utils/server';
import { getDefaultSequelize } from '../../db';
import { getLogger } from './logger';

const _init = createLazyPromise(async () => {
  await polyfillFetch();
  await polyfillCrypto();
  return {};
});
export type CreateContextOptions =
  | CreateNextContextOptions
  | NodeHTTPCreateContextFnOptions<IncomingMessage, ws>
  | CreateHTTPContextOptions
  | CreateWSSContextFnOptions;

export function createContextFactory({
  getSequelize = getDefaultSequelize,
}: {
  getSequelize?: () => MaybePromise<Sequelize>;
}) {
  return async function createContext(opts: CreateContextOptions) {
    await _init;
    const sequelize = await getSequelize();
    const rid = opts.req.headers['x-request-id'];
    const logger = getLogger().child({ rid });
    // let session = getSession(opts);
    return {
      logger,
      sequelize,
    };
  };
}

export interface Context {
  logger: ReturnType<typeof getLogger>;
  sequelize: Sequelize;
}
