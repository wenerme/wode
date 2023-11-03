import { Errors } from '@wener/nestjs';
import { Contexts } from '@wener/nestjs/app';

export function getStaticTenantId() {
  return process.env.WODE_TENANT_ID;
}

export function getFallbackTenantId() {
  return 'org_00000000000000000000000000';
}

export function getTenantId() {
  return Contexts.tenantId.get() || getStaticTenantId();
}

export function getUserId() {
  return Contexts.userId.get();
}

export function requireTenantId() {
  const tid = getTenantId();
  Errors.InternalServerError.check(tid, 'Missing tenant id');
  return tid;
}

export function requireUserId() {
  const uid = Contexts.userId.get();
  Errors.InternalServerError.check(uid, 'Missing user id');
  return uid;
}
