import { buildGraphModule } from '@wener/nestjs/type-graphql';
import { getGlobalStates } from '@wener/utils';
import { AccessTokenService } from '@/foundation/Auth/AccessTokenService';
import { AuthService } from '@/foundation/Auth/AuthService';
import { AccessTokenEntity } from '@/foundation/Auth/entity';
import { AuthResolver } from '@/foundation/Auth/graph/AuthResolver';
import { EntityResolver } from '@/foundation/Resource/graph/EntityResolver';
import { RelayNodeResolver } from '@/foundation/Resource/graph/RelayNodeResolver';
import { CustomAutoEntityService } from '@/foundation/services/CustomAutoEntityService';
import { PingResolver } from '@/foundation/System/graph/PingResolver';
import { SiteResolver } from '@/foundation/System/graph/SiteResolver';
import { SystemResolver } from '@/foundation/System/graph/SystemResolver';
import { SystemService } from '@/foundation/System/SystemService';
import { TenantService } from '@/foundation/Tenant';
import { TenantEntity } from '@/foundation/Tenant/entity/TenantEntity';
import { UserEntity } from '@/foundation/User/entity/UserEntity';
import { UserResolver } from '@/foundation/User/graph/UserResolver';
import { UserService } from '@/foundation/User/UserService';
import { resolveProvides } from '@/server/utils/resolveProvides';

function getInstanceProvides() {
  return [
    // System
    SystemService,
    SystemResolver,
    SiteResolver,
    PingResolver,

    // Tenant
    TenantService,
    TenantEntity,

    // Auth & User
    AuthService,
    AuthResolver,
    AccessTokenEntity,
    AccessTokenService,
    UserEntity,
    UserService,
    UserResolver,
    // Resource
    RelayNodeResolver,
    CustomAutoEntityService,
    EntityResolver,
  ];
}

export function getInstanceGraphModule() {
  return getGlobalStates('InstanceGraphModule', () => buildGraphModule(resolveProvides(getInstanceProvides())));
}
