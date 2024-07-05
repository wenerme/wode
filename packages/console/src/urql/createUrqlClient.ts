import { Client, fetchExchange } from '@urql/core';
import { devtoolsExchange } from '@urql/devtools';
import { cacheExchange, KeyingConfig } from '@urql/exchange-graphcache';
import { persistedExchange } from '@urql/exchange-persisted';
import { retryExchange } from '@urql/exchange-retry';
import { ms } from '@wener/utils';
import { batchFetchExchange } from './batchFetchExchange';

export function createUrqlClient({
  getToken,
  url,
  persisted = false,
  batch = true,
  schema,
}: {
  url: string;
  getToken?: () => string | undefined | null;
  batch?: boolean;
  persisted?: boolean;
  schema?: any;
}): Client {
  const client = new Client({
    url,
    fetchSubscriptions: true,
    // requestPolicy: 'cache-and-network',
    exchanges: [
      process.env.NODE_ENV === 'development' && devtoolsExchange,
      cacheExchange({
        schema,
        keys: new Proxy({} as KeyingConfig, {
          get(target, prop, receiver) {
            if (typeof prop !== 'string') {
              return null;
            }
            let preset = target[prop];
            if (preset) {
              return preset;
            }
            // console.log(`cacheExchange key: ${prop}`);
            let getKey = (data: any) => data?.id;
            if (prop.endsWith('Payload')) {
              getKey = () => null;
            }
            return (target[prop] = getKey);
          },
        }),
        resolvers: {
          Query: {
            node: (parent, args, cache, info) => {
              let __typename = '';
              let id = args.id;
              if (typeof id === 'string') {
                const idType = id.split('_')[0];
                __typename = (
                  {
                    usr: 'User',
                  } as Record<string, string>
                )[idType];
              }
              return __typename ? { __typename, id } : cache.resolve(parent as any, info.parentFieldKey);
            },
          },
        },
      }),
      // scalarExchange({
      //   schema: schema as any,
      //   scalars: {
      //     JSON(value) {
      //       if (value && typeof value === 'string') return JSON.parse(value);
      //       return value;
      //     },
      //   },
      // }),
      batch
        ? batchFetchExchange({
            maxBatchSize: 1000,
            // batchScheduleFn: (callback) => setTimeout(callback, 15),
          })
        : undefined,
      persisted
        ? persistedExchange({
            preferGetForPersistedQueries: true,
            // enforcePersistedQueries: true,
            enableForMutation: true,
            // https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#normalized-caches-urql-and-apollo-client
            generateHash: (_, document: any) => Promise.resolve(document['__meta__']?.['hash']),
          })
        : undefined,
      retryExchange({
        initialDelayMs: 1000,
        maxDelayMs: ms('5m'),
        maxNumberAttempts: Number.POSITIVE_INFINITY,
        // 默认只重试网络错误
        retryIf: (err) => Boolean(err && err.networkError),
      }),
      fetchExchange,
    ].filter(Boolean),
    fetchOptions: () => {
      let headers: Record<string, string> = {};
      const token = getToken?.();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return {
        headers,
      };
    },
  });

  return client;
}
