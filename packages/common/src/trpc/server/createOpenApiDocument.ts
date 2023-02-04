import { type IncomingMessage, type ServerResponse } from 'http';
import { type OpenAPIV3 } from 'openapi-types';
import { generateOpenApiDocument, type OpenApiRouter } from 'trpc-openapi';
import { getBaseUrl } from '../../runtime';

export function createOpenApiDocument(
  appRouter: OpenApiRouter<Record<string, unknown>>,
  {
    req,
    res,
    title = 'APIs',
    description = 'APIs',
    version = '1.0.0',
    servers = [],
    ...rest
  }: Partial<OpenAPIV3.Document> & {
    title?: string;
    description?: string;
    version?: string;
    req?: IncomingMessage;
    res?: ServerResponse;
  } = {},
): OpenAPIV3.Document {
  {
    const found = createOpenApiDocument.cache.get(appRouter);
    if (found) {
      return found;
    }
  }

  let origin;
  if (req?.headers.host) {
    origin = new URL(`${process.env.NODE_ENV === 'development' ? 'http://' : 'https://'}${req.headers.host}`).origin;
  }
  const originBaseUrl = `${getBaseUrl({ origin })}/api`;
  const baseUrl = `${getBaseUrl()}/api`;
  servers ||= [];
  if (!servers.find((v) => v.url === baseUrl)) {
    servers.unshift({ url: baseUrl });
  }
  const originServer = servers.find((v) => v.url === originBaseUrl);
  if (!originServer) {
    servers.unshift({ url: originBaseUrl });
  } else {
    // origin come first
    servers.splice(servers.indexOf(originServer), 1);
    servers.unshift(originServer);
  }
  const doc = {
    ...generateOpenApiDocument(appRouter, {
      title,
      description,
      version,
      baseUrl,
    }),
    servers,
    ...rest,
  };
  createOpenApiDocument.cache.set(appRouter, doc);
  return doc;
}

/**
 * @internal
 */
createOpenApiDocument.cache = new Map<any, OpenAPIV3.Document>();
