import { Entity, OptionalProps, Property, types, Unique } from '@mikro-orm/core';
import { TenantBaseEntity, TenantBaseEntityOptionalFields } from './base/TenantBaseEntity';

@Entity({ tableName: 'storage_item' })
@Unique({ properties: ['code'] })
export class StorageItemEntity extends TenantBaseEntity {
  [OptionalProps]?: TenantBaseEntityOptionalFields;

  @Property({ type: types.string, nullable: true })
  code?: string;
  @Property({ type: types.string, nullable: true })
  authToken?: string;

  @Property({ type: types.string, nullable: true })
  link?: string;

  @Property({ type: types.string, nullable: true })
  fileName?: string;
  @Property({ type: types.string, nullable: true })
  ext?: string;
  @Property({ type: types.string, nullable: true })
  mimeType?: string;

  @Property({ type: types.string, nullable: true })
  md5sum?: string;
  @Property({ type: types.string, nullable: true })
  sha256sum?: string;

  @Property({ type: types.string, nullable: true })
  size?: number;
  @Property({ type: types.string, nullable: true })
  text?: string;
  @Property({ type: types.string, nullable: true })
  width?: number;
  @Property({ type: types.string, nullable: true })
  height?: number;
  @Property({ type: types.string, nullable: true })
  length?: number; // 音频, 视频

  @Property({ type: types.string, nullable: true })
  originUrl?: string;
  @Property({ type: types.string, nullable: true })
  objectUrl?: string;

  @Property({ type: types.string, nullable: true })
  content?: Buffer;
  @Property({ type: types.json, nullable: false, defaultRaw: '{}' })
  metadata?: Record<string, any>;
}
