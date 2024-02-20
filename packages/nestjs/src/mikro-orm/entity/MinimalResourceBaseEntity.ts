import { Entity, Opt, Property, types } from '@mikro-orm/core';
import { MinimalBaseEntity } from './MinimalBaseEntity';

@Entity({ abstract: true })
export abstract class MinimalResourceBaseEntity extends MinimalBaseEntity {
  @Property({ type: types.string, nullable: true })
  eid?: string;

  @Property({ type: types.json, nullable: false, default: '{}' })
  attributes!: Record<string, any> & Opt;

  @Property({ type: types.json, nullable: false, default: '{}' })
  properties!: Record<string, any> & Opt;

  @Property({ type: types.json, nullable: false, default: '{}' })
  extensions!: Record<string, any> & Opt;
}
