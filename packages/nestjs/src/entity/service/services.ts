import type { RequiredEntityData } from '@mikro-orm/core';
import { EntityManager, EntityRepository, FindOneOptions, QueryBuilder } from '@mikro-orm/postgresql';
import { MaybePromise } from '@wener/utils';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { EntityClass } from './EntityClass';
import { FindAllEntityOptions, FindAllEntityResult } from './findAllEntity';
import { ResolveEntityOptions, ResolveEntityResult } from './resolveEntity';
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
  ListEntityRequest,
  PatchEntityRequest,
  ReleaseOwnerRequest,
  ReleaseOwnerResponse,
  ResolveEntityRequest,
  UpdateEntityRequest,
} from './types';

export type ResolveSearchOptions = {
  search: string;
};

export interface EntityService2<E extends StandardBaseEntity> {
  applySearch: (opts: { builder: QueryBuilder<E>; search: string }) => MaybePromise<void>;
  resolveSearch: (opts: ResolveSearchOptions) => MaybePromise<{ and: any[]; or: any[] }>;

  createQueryBuilder({ em }: { em?: EntityManager }): Promise<{ builder: QueryBuilder<E> }>;

  requireEntity(ent: ResolveEntityOptions<E>, ext?: FindOneOptions<E>): Promise<EntityResult<E>>;

  resolveEntity(ent: ResolveEntityOptions<E>, ext?: FindOneOptions<E>): Promise<ResolveEntityResult<E>>;

  findAllEntity(ent: FindAllEntityOptions<E>): Promise<FindAllEntityResult<E>>;

  deleteEntity(ent: ResolveEntityOptions<E>): Promise<{ entity?: E }>;

  undeleteEntity(ent: ResolveEntityOptions<E>): Promise<{ entity?: E }>;

  purgeEntity(ent: ResolveEntityOptions<E>): Promise<{ entity?: E }>;

  createEntity(req: CreateEntityOptions<RequiredEntityData<E>>): Promise<EntityResult<E>>;

  updateEntity(ent: ResolveEntityOptions<E>, opts: UpdateEntityOptions<any>): Promise<EntityResult<E>>;

  patchEntity(ent: ResolveEntityOptions<E>, opts: UpdateEntityOptions<any>): Promise<EntityResult<E>>;

  setEntityNotes(ent: ResolveEntityOptions<E>, req: SetEntityNotesOptions): Promise<EntityResult<E>>;
}

export interface CreateEntityOptions<T> {
  data: T;
  upsert?: boolean;
  onConflict?: {
    fields?: string[];

    action?: 'ignore' | 'merge';

    merge?: string[];

    exclude?: string[];
  };
}

export interface UpdateEntityOptions<T> {
  data: T;
}

export interface EntityService<E extends StandardBaseEntity> extends EntityService2<E> {
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

  claimOwner(req: ClaimOwnerRequest): Promise<ClaimOwnerResponse>;

  assignOwner(req: AssignOwnerRequest): Promise<AssignOwnerResponse>;

  releaseOwner(req: ReleaseOwnerRequest): Promise<ReleaseOwnerResponse>;
}

export type EntityServiceStatic<E extends StandardBaseEntity> = {
  Entity: EntityClass<E>;
};

// export interface HasImportEntityService<E extends StandardBaseEntity> {
//   import(req: ImportEntityRequest): Promise<{ total: number }>;
// }

export interface HasSoftDeleteEntityService<E extends StandardBaseEntity> {
  deleteEntity(req: ResolveEntityOptions<E>): Promise<{ entity?: E }>;

  undeleteEntity(req: ResolveEntityOptions<E>): Promise<{ entity?: E }>;

  purgeEntity(req: ResolveEntityOptions<E>): Promise<{ entity?: E }>;
}

export interface ClaimEntityOwnerOptions {}

export interface AssignEntityOwnerOptions {
  ownerId: string;
}

export interface ReleaseEntityOwnerOptions {}

export type EntityResult<E> = { entity: E };

export interface HasOwnerEntityService<E extends StandardBaseEntity> {
  claimEntityOwner(ent: ResolveEntityOptions<E>, opts: ClaimEntityOwnerOptions): Promise<EntityResult<E>>;

  assignEntityOwner(ent: ResolveEntityOptions<E>, opts: AssignEntityOwnerOptions): Promise<EntityResult<E>>;

  releaseEntityOwner(ent: ResolveEntityOptions<E>, opts: ReleaseEntityOwnerOptions): Promise<EntityResult<E>>;
}

export type SetEntityStatusOptions = {
  status: string;
  state?: string;
  comment?: string;
};

export type SetEntityNotesOptions = {
  notes: string;
};

export interface HasStatusEntityService<E extends StandardBaseEntity> {
  setEntityStatus(ent: ResolveEntityOptions<E>, opts: SetEntityStatusOptions): Promise<EntityResult<E>>;
}

export type BindEntityOptions = {
  entityId: string;
  entityType?: string;
  entity?: StandardBaseEntity;
};

export interface HasEntityRefService<E extends StandardBaseEntity> {
  bindEntity(ent: ResolveEntityOptions<E>, ref: BindEntityOptions): Promise<EntityResult<E>>;

  unbindEntity(req: ResolveEntityOptions<E>): Promise<EntityResult<E>>;
}

export type AnyEntityService<E extends StandardBaseEntity = StandardBaseEntity> = EntityService<E> &
  HasOwnerEntityService<E> &
  HasStatusEntityService<E> &
  HasEntityRefService<E> &
  HasSoftDeleteEntityService<E>;
