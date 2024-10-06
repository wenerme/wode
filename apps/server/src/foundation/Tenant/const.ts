import { Contexts, getCurrentTenantId } from '@wener/nestjs/app';
import { Errors } from '@wener/utils';

export { getStaticTenantId } from '@wener/nestjs/app';
export { getFallbackTenantId, getCurrentUserId as getUserId } from '@wener/nestjs/app';
export { getCurrentTenantId as getTenantId } from '@wener/nestjs/app';

export function requireTenantId() {
  const tid = getCurrentTenantId();
  Errors.InternalServerError.check(tid, 'Missing tenant id');
  return tid;
}

export function requireUserId() {
  const uid = Contexts.userId.get();
  Errors.InternalServerError.check(uid, 'Missing user id');
  return uid;
}
