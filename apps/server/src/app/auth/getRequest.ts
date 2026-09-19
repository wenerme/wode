import type { ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from './AuthPrincipal';

export function getRequest(ctx: ExecutionContext): FastifyRequest['raw'] & { user?: any; principal?: AuthPrincipal } {
	if (ctx.getType<'graphql'>() === 'graphql') {
		const graphqlContext = ctx.getArgByIndex(2) as { req?: FastifyRequest['raw'] } | undefined;
		return graphqlContext?.req ?? (graphqlContext as FastifyRequest['raw']);
	}
	return ctx.switchToHttp().getRequest();
}
