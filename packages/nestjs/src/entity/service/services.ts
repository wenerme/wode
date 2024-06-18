import type { RequiredEntityData } from '@mikro-orm/core';
import type { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { EntityClass } from './EntityBaseService';
import {
  AssignOwnerRequest,
  AssignOwnerResponse,
  ClaimOwnerRequest,
  ClaimOwnerResponse,
  CountEntityRequest,
  CreateEntityRequest,
  DeleteEntityRequest,
  GeneralResponse,
  GetEntityRequest,
  ImportEntityRequest,
  ListEntityRequest,
  PatchEntityRequest,
  PurgeEntityRequest,
  ReleaseOwnerRequest,
  ReleaseOwnerResponse,
  ResolveEntityRequest,
  UndeleteEntityRequest,
  UpdateEntityRequest,
} from './types';

export interface EntityService<E extends StandardBaseEntity> {
  // readonly orm: MikroORM;

  readonly Entity: EntityClass<E>;
  readonly em: EntityManager;
  readonly repo: EntityRepository<E>;

  create(req: CreateEntityRequest & { data: RequiredEntityData<E> }): Promise<E>;

  update(req: UpdateEntityRequest & { data: Partial<E> }): Promise<E>;

  patch(req: PatchEntityRequest): Promise<E>;

  delete(req: DeleteEntityRequest): Promise<GeneralResponse<E>>;

  list(req: ListEntityRequest): Promise<{ total: number; data: E[] }>;

  count(req: CountEntityRequest): Promise<number>;

  find(req: ListEntityRequest): Promise<E[]>;

  get(req: GetEntityRequest): Promise<E>;

  resolve(req: ResolveEntityRequest): Promise<E>;
}

export type BaseEntityServiceStatic<E extends StandardBaseEntity> = {
  Entity: EntityClass<E>;
};

export interface HasImportEntityService<E extends StandardBaseEntity> {
  import(req: ImportEntityRequest): Promise<{ total: number }>;
}

export interface HasSoftDeleteEntityService<E extends StandardBaseEntity> {
  delete(req: DeleteEntityRequest): Promise<GeneralResponse<E>>;

  undelete(req: UndeleteEntityRequest): Promise<E>;

  purge(req: PurgeEntityRequest): Promise<E>;
}

export interface HasOwnerEntityService<E extends StandardBaseEntity> {
  claimOwner(req: ClaimOwnerRequest): Promise<ClaimOwnerResponse>;

  assignOwner(req: AssignOwnerRequest): Promise<AssignOwnerResponse>;

  releaseOwner(req: ReleaseOwnerRequest): Promise<ReleaseOwnerResponse>;
}

export interface HasStatusEntityService<E extends StandardBaseEntity> {
  setStatus(req: SetEntityStatusRequest): Promise<E>;
}

export interface SetEntityStatusRequest {
  id: string;
  status: string;
  comment?: string;
}
