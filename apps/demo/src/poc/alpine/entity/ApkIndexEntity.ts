import { Entity, Opt, Property, types } from '@mikro-orm/core';
import { StandardBaseEntity } from '../../../entity/base/StandardBaseEntity';

@Entity({ tableName: 'apk_index', schema: 'alpine' })
export class ApkIndexEntity extends StandardBaseEntity {
  @Property({ type: types.string, unique: true })
  path!: string; // ${branch}/${repo}/${arch}
  @Property({ type: types.string })
  branch!: string;
  @Property({ type: types.string })
  repo!: string;
  @Property({ type: types.string })
  arch!: string;
  @Property({ type: types.string, nullable: true })
  description?: string;
  @Property({ type: types.string, default: '' })
  content!: string & Opt;
  @Property({ type: types.string })
  lastModifiedTime!: Date;
  @Property({ type: types.integer, default: 0 })
  size!: number & Opt;
}
