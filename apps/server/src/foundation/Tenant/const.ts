import { Contexts, getCurrentTenantId } from '@wener/nestjs/app';
import { Errors } from '@wener/utils';

export { getStaticTenantId } from '@wener/nestjs/app';
export { getFallbackTenantId, getCurrentUserId as getUserId } from '@wener/nestjs/app';
export { getCurrentTenantId as getTenantId, requireTenantId } from '@wener/nestjs/app';

export function requireUserId() {
  const uid = Contexts.userId.get();
  Errors.InternalServerError.check(uid, 'Missing user id');
  return uid;
}
