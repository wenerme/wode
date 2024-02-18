import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { MinimalBaseEntity } from './MinimalBaseEntity';

export type TenantBaseOptionalEntityFields = 'tid';

@Entity({ abstract: true })
export abstract class TenantBaseEntity extends MinimalBaseEntity {
  @Property({ nullable: false, name: 'tid', defaultRaw: 'current_tenant_id()' })
  tid!: string;
}
