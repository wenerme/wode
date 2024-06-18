import { BaseEntity } from '@mikro-orm/core';
import { StandardBaseEntity } from './StandardBaseEntity';

export interface IdentifiableEntity extends BaseEntity {
  id: string;
}

export interface AnyStandardEntity extends StandardBaseEntity {
  sid: number;
  cid?: string;
  rid?: string;
  state: string;
  status: string;
}
