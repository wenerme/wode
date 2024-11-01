import { Entity, OptionalProps, Property, types, type Opt } from '@mikro-orm/core';
import { TenantBaseEntity } from '@wener/nestjs/entity';

@Entity({ tableName: 'file_content' })
export class FileContentEntity extends TenantBaseEntity {
  @Property({ type: types.string, nullable: true })
  fileName?: string;

  @Property({ type: types.string, nullable: false })
  md5sum!: string;

  @Property({ type: types.string, nullable: false })
  sha256sum!: string;

  @Property({ type: types.integer, nullable: false })
  size!: number;

  @Property({ type: types.string, nullable: true })
  mimeType?: string;

  @Property({ type: types.string, nullable: true })
  ext?: string;

  @Property({ type: types.string, nullable: true })
  text?: string;

  @Property({ type: types.integer, nullable: true })
  width?: number;

  @Property({ type: types.integer, nullable: true })
  height?: number;

  @Property({ type: types.integer, nullable: true })
  length?: number;

  @Property({ type: types.string, nullable: true })
  objectUrl?: string;

  @Property({ type: types.string, nullable: true })
  originUrl?: string;

  @Property({ type: types.blob, nullable: false })
  content!: Buffer;

  @Property({ type: types.json, nullable: false, default: '{}' })
  metadata!: Record<string, any> & Opt;
}
