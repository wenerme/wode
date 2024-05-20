import { Entity, Opt, OptionalProps, Property, types } from '@mikro-orm/core';
import { TenantBaseEntity } from '@wener/nestjs/entity';

@Entity({ tableName: 'client_agent' })
export class ClientAgentEntity extends TenantBaseEntity {
  @Property({ type: types.string })
  displayName!: string;
  @Property({ type: types.string, nullable: true })
  description?: string;
  @Property({ type: types.string })
  type!: string; // OpenAiKey
  @Property({ type: types.json, defaultRaw: "'{}'" })
  secrets!: Record<string, any> & Opt;
  @Property({ type: types.json, defaultRaw: "'{}'" })
  config!: Record<string, any> & Opt;
  @Property({ type: types.boolean, default: true })
  active!: boolean & Opt;

  @Property({ type: types.json, defaultRaw: "'{}'" })
  metadata!: Record<string, any>;
}

export enum ClientAgentType {
  OpenAi = 'OpenAi',
}
