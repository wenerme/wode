import { Contexts } from '@wener/nestjs/app';

export function getStaticTenantId() {
  return process.env.TENANT_ID;
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
