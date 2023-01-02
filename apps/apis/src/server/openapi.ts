import { getBaseUrl } from 'common/src/runtime';
import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from './routers/_app';

let openApiDocument: ReturnType<typeof generateOpenApiDocument>;

export function getOpenApiDocument() {
  return (openApiDocument ||= generateOpenApiDocument(appRouter, {
    title: 'APIs',
    description: 'Wener APIs',
    version: '1.0.0',
    baseUrl: `${getBaseUrl()}/api`,
    docsUrl: 'https://apis.wener.me',
    tags: ['auth', 'users', 'posts'],
  }));
}
