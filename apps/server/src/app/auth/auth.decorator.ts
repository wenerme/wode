import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from './getRequest';

class UnauthenticatedError extends Error {
	readonly name = 'UnauthenticatedError';

	constructor(message: string) {
		super(message);
	}
}

export const CurrentUser = createParamDecorator(async (data: { optional?: boolean } = {}, ctx: ExecutionContext) => {
	const { user: value } = getRequest(ctx);
	if (!data.optional && !value) {
		throw new UnauthenticatedError('context user not found');
	}
	return value;
});

export const CurrentPrincipal = createParamDecorator(
	async (data: { optional?: boolean } = {}, ctx: ExecutionContext) => {
		const { principal: value } = getRequest(ctx);
		if (!data.optional && !value) {
			throw new UnauthenticatedError('context auth principal not found');
		}
		return value;
	},
);
