import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '../auth/getRequest';

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request: any = getRequest(ctx);
  return data ? request.cookies?.[data] : request.cookies;
});
