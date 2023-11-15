import { Entity, Property, types } from '@mikro-orm/core';
import { MinimalBaseEntity } from './MinimalBaseEntity';

@Entity({ abstract: true })
export abstract class ResourceBaseEntity<E extends ResourceBaseEntity<any>> extends MinimalBaseEntity<E> {
  /**
   * External Resource ID
   */
  @Property({ type: types.string, nullable: true })
  eid?: string;

  @Property({ type: types.bigint, defaultRaw: 'gen_next_sid()', nullable: false, unique: true })
  sid!: number;
}
