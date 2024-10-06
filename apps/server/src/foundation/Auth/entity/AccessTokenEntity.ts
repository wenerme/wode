import { Entity, Property, types, type Opt } from '@mikro-orm/core';
import { TenantBaseEntity } from '@wener/nestjs/entity';

@Entity({ tableName: 'access_token' })
export class AccessTokenEntity extends TenantBaseEntity {
  @Property({ type: types.string })
  subjectId!: string;

  @Property({ type: types.string })
  subjectType!: string;

  @Property({ type: types.string, defaultRaw: 'gen_random_uuid()' })
  sessionId!: string & Opt;

  @Property({ type: types.string, nullable: true })
  displayName?: string;

  @Property({ type: types.string, nullable: true })
  clientId?: string;

  @Property({ type: types.string, nullable: false })
  grantType!: string;

  @Property({ type: types.string })
  tokenType: string = 'Bearer';

  @Property({ type: types.array, nullable: false, default: '{}' })
  scopes!: string[] & Opt;

  @Property({ type: types.string, defaultRaw: 'gen_random_uuid()' })
  accessToken!: string & Opt;

  @Property({ type: types.datetime, nullable: true })
  expiresAt?: Date;

  @Property({ type: types.integer, nullable: true })
  expiresIn?: number;

  @Property({ type: types.datetime, nullable: true })
  revokedAt?: Date;

  @Property({ type: types.string, nullable: true })
  refreshToken?: string;

  @Property({ type: types.integer, nullable: true })
  refreshExpiresIn?: number;

  @Property({ type: types.datetime, nullable: true })
  refreshExpiresAt?: Date;
  @Property({ type: types.integer, default: 0 })
  refreshCount: number & Opt = 0;
  @Property({ type: types.datetime, nullable: true })
  lastUsedAt?: Date;

  @Property({ type: types.json, nullable: false, default: '{}' })
  metadata!: Record<string, any> & Opt;
}
