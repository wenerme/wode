import { LRUCache } from 'lru-cache';

export interface Token {
  appId: string;
  type: string;
  token: string;
  expiresIn: number; // seconds
  expiresAt: number; // timestamp ms
}

export type TokenProvider = (
  id: string,
  type: string,
  o?: { getter?: () => Promise<Token>; optional?: boolean; refresh?: boolean; lastExpiresAt?: number },
) => Promise<Token>;

export function createDummyTokenProvider(token?: Token): TokenProvider {
  return async (id, type, o) => {
    let t: Token | undefined = token;
    const { getter, optional } = o || {};
    if (!t && getter) {
      t = await getter();
    }
    if (t) {
      return t as any;
    }
    if (optional) {
      return undefined as any;
    }
    throw new Error(`TokenProvider: ${id} ${type} not found`);
  };
}

export function createCachedTokenProvider(next: TokenProvider): TokenProvider {
  const cache = new LRUCache<string, Token>({
    max: 100,
  });
  return async (id, type, o) => {
    const key = `${id}/${type}`;
    const { refresh, getter } = o || {};
    if (!refresh) {
      const cached = cache.get(key);
      const now = Date.now();
      // still valid
      if (cached && (!cached.expiresAt || cached.expiresAt > now)) {
        if (getter && cached.expiresIn) {
          const shouldRefresh = cached.expiresAt < now - 5 * 60 * 1000 * Math.random();
          // max 5m
          if (shouldRefresh) {
            void next(id, type, { ...o, refresh: true, lastExpiresAt: cached.expiresAt }).then((v) => {
              cache.set(key, v);
              console.log(`CacheTokenProvider: ${id} ${type} refreshed`);
            });
          }
        }
        return cached;
      }
    }
    const token = await next(id, type, o);
    if (token) {
      cache.set(key, token, {
        ttl: token.expiresIn * 1000,
      });
    }
    return token;
  };
}
