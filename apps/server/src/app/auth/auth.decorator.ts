import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { UnauthenticatedError } from 'dz17-client';
import { getRequest } from './getRequest';

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
