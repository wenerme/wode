import { getBaseUrl } from 'common/src/runtime';
import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from './routers/_app';

let openApiDocument: ReturnType<typeof generateOpenApiDocument>;

export function getOpenApiDocument({ origin }: { origin?: string }) {
  const baseUrl = `${getBaseUrl({ origin })}/api`;
  // origin server be the first
  const set = new Set([`${getBaseUrl()}/api`, 'https://apis.wener.me/api']);
  set.delete(baseUrl);
  const servers = [baseUrl, ...Array.from(set).sort()];

  return (openApiDocument ||= {
    ...generateOpenApiDocument(appRouter, {
      title: 'APIs',
      description: 'Wener APIs',
      version: '1.0.0',
      baseUrl: baseUrl,
      docsUrl: 'https://apis.wener.me',
      tags: ['auth', 'users', 'posts'],
    }),
    servers: servers.map((url) => ({ url })),
  });
}
