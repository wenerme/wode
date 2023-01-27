import { getBaseUrl } from 'common/src/runtime';
import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from './routers/_app';

let openApiDocument: ReturnType<typeof generateOpenApiDocument>;

export function getOpenApiDocument({ origin }: { origin?: string }) {
  const baseUrl = `${getBaseUrl({ origin })}/api`;
  return (openApiDocument ||= {
    ...generateOpenApiDocument(appRouter, {
      title: 'APIs',
      description: 'Wener APIs',
      version: '1.0.0',
      baseUrl: baseUrl,
      docsUrl: 'https://apis.wener.me',
      tags: ['auth', 'users', 'posts'],
    }),
    servers: [
      {
        url: baseUrl,
      },
      {
        url: 'https://apis.wener.me',
      },
    ],
  });
}
