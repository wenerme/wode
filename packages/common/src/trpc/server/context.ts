import { type Sequelize } from '@sequelize/core';
import { type MaybePromise } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import { type CreateHTTPContextOptions } from '@trpc/server/dist/adapters/standalone';
import { type CreateWSSContextFnOptions } from '@trpc/server/dist/adapters/ws';
import { createLazyPromise } from '@wener/utils';
import { polyfillCrypto } from '@wener/utils/server';
import { type IncomingMessage } from 'http';
import type ws from 'ws';
import { getDefaultSequelize } from '../../db';
import { getLogger } from './logger';

const _init = createLazyPromise(async () => {
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
