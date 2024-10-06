import { BeforeCreate, Entity, Filter, Property, types, Unique, type Opt } from '@mikro-orm/core';
import { getCurrentTenantId } from '../app';
import { CurrentTenantIdFilter } from './CurrentTenantIdFilter';
import { StandardBaseEntity } from './StandardBaseEntity';

export type TenantBaseEntityOptionalFields =
  | 'id'
  | 'uid'
  | 'createdAt'
  | 'updatedAt'
  | 'sid' // number based serial id
  | 'tid'
  | 'attributes'
  | 'properties'
  | 'extensions'
  | 'metadata'
  | 'ownerUser'
  | 'ownerTeam'
  | 'ownerUserId'
  | 'ownerTeamId';

@Entity({ abstract: true })
@Filter(CurrentTenantIdFilter)
@Unique({ properties: ['tid', 'eid'] })
export class TenantBaseEntity extends StandardBaseEntity {
  @Property({ type: types.string, nullable: false, defaultRaw: 'public.current_tenant_id()' })
  tid!: string & Opt;

  @BeforeCreate()
  setTenantBeforeCreate() {
    // TidFilter 不会处理 create
    this.tid ||= getCurrentTenantId() || this.tid;
  }

  // upsert bind 有问题
}
