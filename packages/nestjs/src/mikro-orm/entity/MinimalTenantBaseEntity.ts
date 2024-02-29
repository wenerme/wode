import { Entity, Opt, Property } from '@mikro-orm/core';
import { MinimalBaseEntity } from './MinimalBaseEntity';

@Entity({ abstract: true })
export abstract class MinimalTenantBaseEntity extends MinimalBaseEntity {
  @Property({ nullable: false, name: 'tid', defaultRaw: 'current_tenant_id()' })
  tid!: string & Opt;
}
