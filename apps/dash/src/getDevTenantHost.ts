import process from 'node:process';
import { isDev } from '@wener/console';

export function getDevTenantHost(host?: string | null) {
  if (isDev()) return (process.env.NEXT_PUBLIC_DEV_TENANT_HOST || host) ?? undefined;
  return host ?? undefined;
}
