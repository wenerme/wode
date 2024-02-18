import { Entity, ManyToOne, OptionalProps, Property, type Rel, types } from '@mikro-orm/core';
import { ClientAgentEntity } from './ClientAgentEntity';
import type { TenantBaseEntityOptionalFields } from './base/TenantBaseEntity';
import { TenantBaseEntity } from './base/TenantBaseEntity';

@Entity({ tableName: 'access_token' })
export class AccessTokenEntity extends TenantBaseEntity {
  [OptionalProps]?: TenantBaseEntityOptionalFields | 'sessionId' | 'metadata' | 'scopes' | 'accessToken' | 'tokenType';

  @ManyToOne({ entity: () => ClientAgentEntity, nullable: true })
  clientAgent?: Rel<ClientAgentEntity>;

  @Property({ type: types.string, nullable: true, persist: false })
  get clientAgentId() {
    return this.clientAgent?.id;
  }

  @Property({ type: types.string })
  subjectId!: string;

  @Property({ type: types.string })
  subjectType!: string;

  @Property({ type: types.string, defaultRaw: 'gen_random_uuid()' })
  sessionId!: string;

  @Property({ type: types.string, nullable: true })
  displayName?: string;

  @Property({ type: types.string, nullable: true })
  clientId?: string;

  @Property({ type: types.string, nullable: false })
  grantType!: string;

  @Property({ type: types.string })
  tokenType: string = 'Bearer';

  @Property({ type: types.array, nullable: false, default: '{}' })
  scopes!: string[];

  @Property({ type: types.string, defaultRaw: 'gen_random_uuid()' })
  accessToken!: string;

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

  @Property({ type: types.datetime, nullable: true })
  lastUsedAt?: Date;

  @Property({ type: types.json, nullable: false, default: '{}' })
  metadata!: Record<string, any>;
}
