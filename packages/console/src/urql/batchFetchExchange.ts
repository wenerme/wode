// https://gist.github.com/reconbot/c888c0f5c4cc1ac60db14fa389259cec
import DataLoader from 'dataloader';
import { LRUCache } from 'lru-cache';
import { Exchange, Operation } from 'urql';
import { map, pipe } from 'wonka';

interface BatchRequest {
  url: RequestInfo | URL;
  options?: RequestInit;
}

const batchFetch =
  (loader: DataLoader<BatchRequest, Response>): typeof fetch =>
  (url: RequestInfo | URL, options?: RequestInit) => {
    return loader.load({ url, options });
  };

const loadBatch = (fetcher: typeof fetch) => async (requests: Readonly<BatchRequest[]>) => {
  // if batch has just one item don't batch it
  if (requests.length === 1) return [await fetcher(requests[0].url, requests[0].options)];
  const requestBody = requests
    .map((req) => JSON.parse(req.options?.body?.toString() ?? '{}'))
    .map((body) => ({
      query: body.query,
      operationName: body.operationName,
      variables: body.variables,
      extensions: body.extensions,
    }));

  const response = await fetcher(requests[0].url, {
    ...requests[0].options,
    body: JSON.stringify(requestBody),
  });

  const bodies: object[] = await response.json();
  const { status, statusText, ok, headers, url } = response;
  return bodies.map((body) => {
    return {
      url,
      headers,
      status,
      statusText,
      ok,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as Response;
  });
};

// You want to put your own logic here - I want to opt out of batching per `useQuery({ query, context: useMemo(() => ({ batch: false }), []) })`
// but you do you!
const shouldBatch = (operation: Operation): boolean => {
  return operation.kind === 'query' && (operation.context.batch ?? true);
};

export const batchFetchExchange =
  (options?: DataLoader.Options<BatchRequest, Response>, fetcher = fetch): Exchange =>
  ({ forward }) => {
    const loader = new DataLoader(loadBatch(fetcher), {
      // short-lived cache
      cacheMap: new LRUCache<any, any>({ max: 2000, ttl: 60 * 1000 }),
      ...options,
    });
    return (ops$) =>
      pipe(
        ops$,
        map((operation: Operation) => {
          const fetch = shouldBatch(operation) ? batchFetch(loader) : operation.context.fetch;
          return {
            ...operation,
            context: {
              ...operation.context,
              fetch,
            },
          };
        }),
        forward,
      );
  };
