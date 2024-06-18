import { BaseEntity, Collection, Opt, Ref } from '@mikro-orm/core';
import { IdentifiableEntity } from '../types';

export interface HasTidEntity {
  tid: string;
}

export interface HasSidEntity {
  sid: number;
}

export interface HasVendorRefEntity {
  cid?: string;
  rid?: string;
}

export interface HasStateStatusEntity {
  state: string & Opt;
  status: string & Opt;
}

export interface HasTagsEntity {
  tags?: string[];
}

export interface HasDisplayOrderEntity {
  displayOrder: number;
}

export interface HasLabelsEntity<E extends BaseEntity = BaseEntity> {
  labels: Collection<E>;
}

export interface HasNotesEntity {
  notes?: string;
}

export interface HasMetadataEntity {
  metadata?: Record<string, any>;
}

export interface HasCodeEntity {
  code?: string;
}

export interface HasEntityRefEntity {
  entityId?: string;
  entityType?: string;
  entity?: Ref<IdentifiableEntity>;
}

export interface HasRequiredEntityRefEntity {
  entityId: string;
  entityType: string;
  entity: Ref<IdentifiableEntity>;
}

export interface HasCustomerRefEntity {
  customerId?: string;
  customerType?: string;
  customer?: Ref<IdentifiableEntity>;
}

export interface HasOwnerRefEntity {
  ownerId?: string;
  ownerType?: string;
  owner?: Ref<IdentifiableEntity>;
}

export interface IsHierarchyEntity<E extends IsHierarchyEntity<any>> extends IdentifiableEntity {
  parent?: E;
  children: Collection<E>;

  parentId?: string;
}

interface IsConnectionEntity {
  entity1Id?: string;
  entity1Type?: string;
  entity1?: Ref<IdentifiableEntity>;
  entity1Role?: string;

  entity2Id?: string;
  entity2Type?: string;
  entity2?: Ref<IdentifiableEntity>;
  entity2Role?: string;

  effectiveStart?: Date;
  effectiveEnd?: Date;

  description?: string;
  entityImage?: string;
}

// Connection Association  Link, Join, Relation
