import { Entity } from '@mikro-orm/core';
import { TenantBaseEntity } from '@wener/server/entity';

@Entity({ abstract: true })
export abstract class SystemBaseEntity extends TenantBaseEntity {}
