import { Logger } from '@nestjs/common';
import { getContext } from '@wener/nestjs';
import { Contexts } from '@wener/nestjs/app';
import type { NextRequest } from 'next/server';
import { getDevTenantHost } from '../../getDevTenantHost';
import type { NextRouteHandler, NextRouteHandlerContext } from './withNextRouteHandler';

const log = new Logger(withTenant.name);

export function withTenant(handler: NextRouteHandler): NextRouteHandler {
  if (getDevTenantHost()) {
    log.log(`Dev tenant host ${getDevTenantHost()}`);
  }
  return async (req: NextRequest, ctx: NextRouteHandlerContext) => {
    // if (!svc) {
    //   svc = getContext(RemoteTenantService);
    // }
    // const tid = Contexts.tenantId.get();
    // if (!tid) {
    //   const host = getDevTenantHost(req.headers.get('host'));
    //   const tenant = await svc.findTenantByHost({ host });
    //   if (tenant) {
    //     Contexts.tenantId.set(tenant.id);
    //   }
    //   log.debug(`resolve tenant ${host} to ${Contexts.tenantId.get()} <-> ${tenant?.id}`);
    // }
    return handler(req, ctx);
  };
}
