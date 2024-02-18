import { Entity, OptionalProps, Property, types } from '@mikro-orm/core';
import { TenantBaseEntity, TenantBaseEntityOptionalFields } from './base/TenantBaseEntity';

@Entity({ tableName: 'client_agent' })
export class ClientAgentEntity extends TenantBaseEntity {
  [OptionalProps]?: TenantBaseEntityOptionalFields | 'secret' | 'config' | 'secrets' | 'enable';

  @Property({ type: types.string })
  displayName!: string;
  @Property({ type: types.string, nullable: true })
  description?: string;
  @Property({ type: types.string })
  type!: string; // OpenAiKey
  @Property({ type: types.json, defaultRaw: "'{}'" })
  secrets!: Record<string, any>;
  @Property({ type: types.json, defaultRaw: "'{}'" })
  config!: Record<string, any>;
  @Property({ type: types.boolean, default: true })
  active!: boolean;

  @Property({ type: types.json, defaultRaw: "'{}'" })
  metadata!: Record<string, any>;
}

export enum ClientAgentType {
  OpenAi = 'OpenAi',
}
