import { Entity, ManyToOne } from '@mikro-orm/core';
import { MinimalBaseEntity } from './MinimalBaseEntity';

export type TenantBaseOptionalEntityFields = 'tid';

@Entity({ abstract: true })
export abstract class TenantBaseEntity<E extends TenantBaseEntity<any>> extends MinimalBaseEntity<E> {
  @ManyToOne({ nullable: false, name: 'tid', defaultRaw: 'current_tenant_id()', onUpdateIntegrity: 'no action' })
  tid!: string;
}
