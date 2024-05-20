import { Entity } from '@mikro-orm/core';
import { TenantBaseEntity } from '@wener/nestjs/entity';

@Entity({ abstract: true })
export abstract class SystemBaseEntity extends TenantBaseEntity {}
