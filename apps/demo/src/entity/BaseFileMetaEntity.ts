import { Entity, type Opt, Property, types } from '@mikro-orm/core';
import {
  TenantBaseEntity,
  withEntityRefEntity,
  withMetadataEntity,
  withNotesEntity,
  withTagsEntity,
} from '@wener/nestjs/entity';
import { mixin } from '@wener/utils';

@Entity({ tableName: 'file_meta' })
export class BaseFileMetaEntity extends mixin(TenantBaseEntity, withTagsEntity, withNotesEntity, withEntityRefEntity, withMetadataEntity) {
  @Property({ type: types.string, nullable: true })
  filename?: string;
  @Property({ type: types.string, nullable: true })
  description?: string;

  @Property({ type: types.string, nullable: false })
  ext!: string;

  @Property({ type: types.string, nullable: false })
  type!: string;

  @Property({ type: types.string, nullable: false })
  md5sum!: string;

  @Property({ type: types.string, nullable: false })
  sha256sum!: string;

  @Property({ type: types.integer, nullable: false })
  size!: number;

  @Property({ type: types.string, nullable: true })
  text?: string;

  @Property({ type: types.integer, nullable: true })
  width?: number;

  @Property({ type: types.integer, nullable: true })
  height?: number;

  @Property({ type: types.integer, nullable: true })
  length?: number; // audio, video

  @Property({ type: types.string, nullable: true })
  originUrl?: string;

  @Property({ type: types.string, nullable: true })
  objectUrl?: string;

  @Property({ type: types.blob, nullable: true })
  content?: Buffer;
}

