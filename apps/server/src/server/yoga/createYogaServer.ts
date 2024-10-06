import process from 'node:process';
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { useGraphQLSSE } from '@graphql-yoga/plugin-graphql-sse';
import type { HttpBindings } from '@hono/node-server';
import { Logger } from '@nestjs/common';
import { getContext } from '@wener/nestjs';
import { Contexts } from '@wener/nestjs/app';
import { Errors } from '@wener/utils';
import { GraphQLError, GraphQLSchema } from 'graphql';
import { createYoga, type YogaInitialContext, type YogaSchemaDefinition, type YogaServerOptions } from 'graphql-yoga';

export function createYogaServer() {
  const log = new Logger('GraphQLServer');
  let isDev = process.env.NODE_ENV === 'development';

  let opts: YogaServerOptions<GraphContext, GraphContext> = {
    logging: true,
    schema: getContext(GraphQLSchema) as YogaSchemaDefinition<any, any>,
    batching: {
      limit: 1000,
    },
    context: (ctx) => {
      ctx.userId ||= Contexts.userId.get() || '';
      return ctx;
    },
    graphqlEndpoint: '/graphql',
    graphiql: (req) => {
      if (isDev || isGraphiQLAllowed(req)) {
        return {
          subscriptionsProtocol: 'GRAPHQL_SSE',
        };
      }
      console.log(`block GraphiQL: ${req.url}`);
      return false;
    },
    maskedErrors: {
      isDev: isDev,
      maskError: (error: unknown, message: string, isDev?: boolean) => {
        if (error instanceof GraphQLError) {
          log.error(`GraphQL Error: ${error}`);
          const ctx = {
            requestId: Contexts.requestId.get(),
            userId: Contexts.userId.get(),
            sessionId: Contexts.sessionId.get(),
            clientId: Contexts.clientId.get(),
            headers: Contexts.request.get()?.headers,
          };
          console.error(`GraphQL Error`, ctx, error);
          return error;
        }
        log.error(`GraphQL Resolve Error: ${error}`);
        isDev && console.error(error);
        let detail = Errors.resolve(error);
        return new GraphQLError(detail.message, undefined, undefined, undefined, undefined);
      },
    },
    plugins: [
      // usePersistedOperations({
      //   getPersistedOperation(hash: string) {
      //     return getPersistedOperation(hash);
      //   },
      // }),
      isDev
        ? null
        : useDisableIntrospection({
            isDisabled: (req) => {
              return !isIntrospectionAllowed(req);
            },
          }),
      useDeferStream(),
      useGraphQLSSE({
        endpoint: '/graphql/stream',
        // endpoint: '/graphql',
      }),
    ].filter(Boolean),
  };

  // let server = new YogaServer(opts);
  // return {
  //   server,
  //   fetch: server.handle,
  // };

  return createYoga(opts);
}

interface UserContext {
  userId: string;
}

export interface GraphContext extends YogaInitialContext, HttpBindings, UserContext {}

function getPersistedOperation(hash: string) {
  return null;
}

function isGraphiQLAllowed(req: Request) {
  return req.url.includes('debug');
}

function isIntrospectionAllowed(req: Request) {
  // 如果来源页包含了 debug
  return req.headers.get('referer')?.includes('debug');
}
