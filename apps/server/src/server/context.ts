import { Currents } from '@wener/nestjs';
import { setCurrentContext } from '@wener/nestjs/app';
import { StandardBaseEntity, TenantBaseEntity } from '@wener/nestjs/entity';
import { AccessTokenEntity } from '@/foundation/Auth/entity';
import { TenantEntity } from '@/foundation/Tenant/entity/TenantEntity';
import { UserEntity } from '@/foundation/User/entity/UserEntity';

export const ServerContexts = {
  token: Currents.create<AccessTokenEntity>('AccessToken'),
  subject: Currents.create<StandardBaseEntity>('AccessSubject'),
  tenant: Currents.create<TenantEntity>('AccessTenant'),
  user: Currents.create<UserEntity>('AccessUser'),
  roles: Currents.create<string[]>('AccessRoles'),
  // debugDatabase: Currents.create<boolean>('XDebugDB'),
  debug: Currents.create<boolean>('ServerDebug'),
} as const;

export function setServerContext({
  tenant,
  token,
  subject,
  user,
}: {
  token?: AccessTokenEntity;
  subject?: TenantBaseEntity;
  tenant?: TenantEntity;
  user?: UserEntity;
}) {
  const tenantId = tenant?.id || token?.tid || subject?.tid || undefined;
  const sessionId = token?.sessionId;
  const userId = user?.id || (token?.subjectType === 'User' ? subject?.id : undefined);
  const clientId = token?.clientId;
  let ctx = {
    tenantId,
    sessionId,
    userId,
    clientId,
  };
  setCurrentContext(ctx);
  tenant && ServerContexts.tenant.set(tenant);
  token && ServerContexts.token.set(token);
  subject && ServerContexts.subject.set(subject);
  user && ServerContexts.user.set(user);

  return ctx;
}
