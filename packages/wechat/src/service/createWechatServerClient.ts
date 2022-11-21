import { HttpsProxyAgent } from 'https-proxy-agent';
import type { LOCK } from '@sequelize/core';
import type { TokenProvider } from '../server/Token';
import { WechatServerClient } from '../server/WechatServerClient';
import { WechatToken } from './db/models';

export function createWechatServerClient() {
  const { WX_PROXY: proxy, WX_APP_ID: appId, WX_APP_SECRET: appSecret } = process.env;
  let fetch: FetchLike = globalThis.fetch;
  const logger = console;
  if (proxy) {
    fetch = createProxyFetch(proxy, fetch);
    logger.log(`createWechatServerClientFromEnv: add proxy`);
  }

  return new WechatServerClient({
    appId,
    appSecret,
    fetch,
    logger,
    tokenProvider: createTokenProvider(),
  });
}

export function createTokenProvider(): TokenProvider {
  return async (id, type, o) => {
    if (!WechatToken.sequelize) {
      throw new Error(`WechatToken.sequelize is null`);
    }
    const { getter, optional, refresh, lastExpiresAt } = o || {};
    let found: WechatToken | null;
    found = await WechatToken.findOne({ where: { appId: id, type } });
    const isExpired = found?.expiresAt && found.expiresAt.getTime() < Date.now();
    if (getter && (!found || refresh || isExpired)) {
      found = await WechatToken.sequelize.transaction(async (t) => {
        console.debug(
          `createTokenProvider: ${id} ${type} not found or ask for refresh(${refresh}) or expired(${isExpired}), try to get from getter, last expiresAt ${found?.expiresAt}`,
        );
        let neo = await WechatToken.findOne({ where: { appId: id, type }, lock: 'UPDATE' as LOCK, transaction: t });
        // updated
        if (neo && neo.token !== found?.token) {
          console.log(`createTokenProvider: ${id} ${type} token updated, use it`);
          return neo;
        }
        if (lastExpiresAt && neo && neo.expiresAt && neo.expiresAt.getTime() > lastExpiresAt) {
          console.log(`createTokenProvider: ${id} ${type} expires updated use it`);
          return neo;
        }
        const r = await getter();
        [neo] = await WechatToken.upsert(
          {
            ...r,
            expiresAt: new Date(r.expiresAt),
          },
          {
            returning: true,
            transaction: t,
            conflictFields: ['app_id', 'type'] as any, // fixme https://github.com/sequelize/sequelize/pull/14199
          },
        );
        console.debug(`createTokenProvider: ${id} ${type} refreshed ${neo.expiresAt}`);
        return neo;
      });
    }
    if (!found) {
      if (optional) {
        return undefined as any;
      }
      throw new Error(`token ${type} of ${id} not found`);
    }
    return {
      appId: found.appId,
      type: found.type,
      token: found.token,
      expiresIn: found.expiresIn,
      expiresAt: found.expiresAt,
    };
  };
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

function createProxyFetch(proxy: string, fetch: FetchLike = globalThis.fetch) {
  const agent = new HttpsProxyAgent(proxy);
  return (url: string, init?: RequestInit) => {
    return fetch(url, {
      ...init,
      agent,
    } as any);
  };
}
