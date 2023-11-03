import { BeforeCreate, Entity, Filter, Property, types, Unique } from '@mikro-orm/core';
import { getTenantId } from '../modules/tenant';
import { StandardBaseEntity } from './StandardBaseEntity';
import { TidFilter } from './TidFilter';

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
@Filter(TidFilter)
@Unique({ properties: ['tid', 'eid'] })
export abstract class TenantBaseEntity<E extends TenantBaseEntity<any> = any> extends StandardBaseEntity<E> {
  @Property({ type: types.string, nullable: false, defaultRaw: 'public.current_tenant_id()' })
  tid!: string;

  @BeforeCreate()
  setTenantBeforeCreate() {
    // TidFilter 不会处理 create
    this.tid ||= getTenantId() || this.tid;
  }

  // upsert bind 有问题
}
