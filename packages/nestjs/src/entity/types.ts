import { BaseEntity } from '@mikro-orm/core';
import {
  HasCodeEntity,
  HasCustomerRefEntity,
  HasMetadataEntity,
  HasNotesEntity,
  HasOwnerRefEntity,
  HasSidEntity,
  HasStateStatusEntity,
  HasTagsEntity,
  HasVendorRefEntity,
} from './mixins';
import { StandardBaseEntity } from './StandardBaseEntity';

export interface IdentifiableEntity extends BaseEntity {
  id: string;
}

export interface AnyStandardEntity
  extends StandardBaseEntity,
    HasSidEntity,
    HasCodeEntity,
    HasCustomerRefEntity,
    HasMetadataEntity,
    HasNotesEntity,
    HasOwnerRefEntity,
    HasStateStatusEntity,
    HasTagsEntity,
    HasVendorRefEntity {}
