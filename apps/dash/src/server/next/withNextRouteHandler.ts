import { Logger } from '@nestjs/common';
import { Contexts } from '@wener/nestjs/app';
import { Errors, type MaybePromise } from '@wener/utils';
import { type NextRequest, NextResponse } from 'next/server';
import { isBuilding } from '../../const';
import { withRunContext } from './withRunContext';

const log = new Logger(`NextRouteHandler`);

export interface NextRouteHandlerContext {
  params: Record<string, string | string[]>;
}

export type NextRouteHandler = (req: NextRequest, ctx: NextRouteHandlerContext) => MaybePromise<Response | void>;

function withAutoResponse(
  handler: (req: NextRequest, ctx: NextRouteHandlerContext) => MaybePromise<Response | any>,
): NextRouteHandler {
  return async (req: NextRequest, ctx: NextRouteHandlerContext) => {
    const tid = Contexts.tenantId.get();
    log.log([tid && `[${tid}]`, req.method, req.url, JSON.stringify(ctx.params)].filter(Boolean).join(' '));

    try {
      const res = await handler(req, ctx);
      if (res === undefined || res === null) {
        return;
      }
      if (res instanceof Response) {
        return res;
      }
      if (typeof res === 'string' || res instanceof ReadableStream || ArrayBuffer.isView(res)) {
        return new Response(res);
      }
      return NextResponse.json(res);
    } catch (e) {
      const detail = Errors.resolve(e);
      log.error(`${req.method} ${req.url} ${detail.message}`, detail);
      return NextResponse.json(detail, {
        status: detail.status,
      });
    }
  };
}

export type NextRouteMiddleware = (next: NextRouteHandler) => NextRouteHandler;

function createLoggingMiddleware() {
  return (next: NextRouteHandler) => async (req: NextRequest, ctx: NextRouteHandlerContext) => {
    const tid = Contexts.tenantId.get();
    log.log([tid && `[${tid}]`, req.method, req.url, JSON.stringify(ctx.params)].filter(Boolean).join(' '));
    return next(req, ctx);
  };
}

export function withNextRouteHandler(
  handler: (req: NextRequest, ctx: NextRouteHandlerContext) => MaybePromise<Response | any>,
  {
    middlewares = [],
  }: {
    middlewares?: NextRouteMiddleware[];
  } = {},
): NextRouteHandler {
  if (isBuilding()) {
    return (req) => {
      log.debug(`Skip ${req.url} route when building`);
      return new Response('Building');
    };
  }
  let next = withAutoResponse(handler);
  middlewares = [
    withRunContext,
    ...middlewares,
    // , createLoggingMiddleware(),
  ];
  next = middlewares.reduceRight((f, m) => m(f), next);
  return next;
}
