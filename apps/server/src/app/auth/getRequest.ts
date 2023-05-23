import { type FastifyRequest } from 'fastify';
import { type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { type AuthPrincipal } from './AuthPrincipal';

export function getRequest(ctx: ExecutionContext): FastifyRequest['raw'] & { user?: any; principal?: AuthPrincipal } {
  if (ctx.getType<'graphql'>() === 'graphql') {
    return GqlExecutionContext.create(ctx).getContext().req;
  }
  return ctx.switchToHttp().getRequest();
}
