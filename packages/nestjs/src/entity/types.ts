import { BaseEntity } from '@mikro-orm/core';

export interface IdentifiableEntity extends BaseEntity {
  id: string;
}
