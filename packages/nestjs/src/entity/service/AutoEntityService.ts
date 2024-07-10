import { RequiredEntityData } from '@mikro-orm/core';
import { EntityManager, EntityRepository, FindOneOptions, MikroORM, QueryBuilder } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Errors } from '@wener/utils';
import { getEntityDef } from '../defineEntity';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { EntityBaseService } from './EntityBaseService';
import { FindAllEntityOptions, FindAllEntityResult } from './findAllEntity';
import { ResolveEntityOptions, ResolveEntityResult } from './resolveEntity';
import {
  AnyEntityService,
  AssignEntityOwnerOptions,
  BindEntityOptions,
  ClaimEntityOwnerOptions,
  CreateEntityOptions,
  EntityResult,
  EntityService,
  HasOwnerEntityService,
  HasStatusEntityService,
  ReleaseEntityOwnerOptions,
  SetEntityNotesOptions,
  SetEntityStatusOptions,
  UpdateEntityOptions,
} from './services';
import {
  AssignOwnerRequest,
  ClaimOwnerRequest,
  CountEntityRequest,
  CreateEntityRequest,
  DeleteEntityRequest,
  GetEntityRequest,
  ListEntityRequest,
  PatchEntityRequest,
  ReleaseOwnerRequest,
  ResolveEntityRequest,
  UpdateEntityRequest,
} from './types';

@Injectable()
export class AutoEntityService
  implements
    EntityService<StandardBaseEntity>,
    HasOwnerEntityService<StandardBaseEntity>,
    HasStatusEntityService<StandardBaseEntity>
{
  readonly Entity = StandardBaseEntity;

  constructor(
    protected readonly orm: MikroORM,
    readonly em: EntityManager = orm.em,
  ) {}

  applySearch() {}

  resolveSearch() {
    return {
      and: [],
      or: [],
    };
  }

  createEntity<E extends StandardBaseEntity>(
    req: CreateEntityOptions<RequiredEntityData<E>>,
  ): Promise<EntityResult<E>> {
    throw Errors.NotImplemented.throw();
  }

  updateEntity<E extends StandardBaseEntity>(
    ent: ResolveEntityOptions<E>,
    opts: UpdateEntityOptions<any>,
  ): Promise<EntityResult<E>> {
    throw Errors.NotImplemented.throw();
  }

  patchEntity<E extends StandardBaseEntity>(
    ent: ResolveEntityOptions<E>,
    opts: UpdateEntityOptions<any>,
  ): Promise<EntityResult<E>> {
    throw Errors.NotImplemented.throw();
  }

  createQueryBuilder({ em }: { em?: EntityManager }): Promise<{ builder: QueryBuilder<StandardBaseEntity> }> {
    throw Errors.NotImplemented.throw();
  }

  findAllEntity(req: FindAllEntityOptions<StandardBaseEntity>): Promise<FindAllEntityResult<StandardBaseEntity>> {
    throw Errors.NotImplemented.throw();
  }

  get repo(): EntityRepository<StandardBaseEntity> {
    throw Errors.NotImplemented.throw();
  }

  create(req: CreateEntityRequest & { data: RequiredEntityData<StandardBaseEntity> }): Promise<StandardBaseEntity> {
    throw Errors.NotImplemented.throw();
  }

  list(req: ListEntityRequest): Promise<{ total: number; data: StandardBaseEntity[] }> {
    throw Errors.NotImplemented.throw();
  }

  find(req: ListEntityRequest): Promise<StandardBaseEntity[]> {
    throw Errors.NotImplemented.throw();
  }

  count(req: CountEntityRequest): Promise<number> {
    throw Errors.NotImplemented.throw();
  }

  patch(req: PatchEntityRequest) {
    return this.getEntityService(req).patch(req);
  }

  update(req: UpdateEntityRequest & { data: Partial<StandardBaseEntity> }): Promise<StandardBaseEntity> {
    return this.getEntityService(req).update(req);
  }

  getEntityService<E extends StandardBaseEntity>({ id }: ResolveEntityOptions<E>): AnyEntityService<E> {
    const def = getEntityDef(id);
    if (!def) {
      throw new Error(`Invalid entity id: ${id}`);
    }
    let service = EntityBaseService.getService<AnyEntityService<E>>(def.Entity);
    if (!service) {
      throw new Error(`Entity service not found: ${id}`);
    }
    return service;
  }

  get(req: GetEntityRequest) {
    return this.getEntityService(req).get(req);
  }

  resolve(req: ResolveEntityRequest) {
    return this.getEntityService(req).resolve(req);
  }

  claimOwner(req: ClaimOwnerRequest) {
    return this.getEntityService(req).claimOwner(req);
  }

  releaseOwner(req: ReleaseOwnerRequest) {
    return this.getEntityService(req).releaseOwner(req);
  }

  assignOwner(req: AssignOwnerRequest) {
    return this.getEntityService(req).assignOwner(req);
  }

  delete(req: DeleteEntityRequest) {
    return this.getEntityService(req).delete(req);
  }

  async setEntityStatus<E extends StandardBaseEntity>(ent: ResolveEntityOptions<E>, opts: SetEntityStatusOptions) {
    return this.getEntityService(ent).setEntityStatus(ent, opts);
  }

  requireEntity<E extends StandardBaseEntity>(
    req: ResolveEntityOptions<E>,
    ext?: FindOneOptions<E>,
  ): Promise<{
    entity: E;
  }> {
    return this.getEntityService(req).requireEntity(req, ext);
  }

  resolveEntity<E extends StandardBaseEntity>(
    req: ResolveEntityOptions<E>,
    ext?: FindOneOptions<E>,
  ): Promise<ResolveEntityResult<E>> {
    return this.getEntityService(req).requireEntity(req, ext);
  }

  deleteEntity<E extends StandardBaseEntity>(req: ResolveEntityOptions<E>): Promise<{ entity?: E }> {
    return this.getEntityService(req).deleteEntity(req);
  }

  undeleteEntity<E extends StandardBaseEntity>(req: ResolveEntityOptions<E>): Promise<{ entity?: E }> {
    return this.getEntityService(req).undeleteEntity(req);
  }

  purgeEntity<E extends StandardBaseEntity>(req: ResolveEntityOptions<E>): Promise<{ entity?: E }> {
    return this.getEntityService(req).purgeEntity(req);
  }

  bindEntity<E extends StandardBaseEntity>(
    ent: ResolveEntityOptions<E>,
    ref: BindEntityOptions,
  ): Promise<{
    entity?: E;
  }> {
    return this.getEntityService(ent).bindEntity(ent, ref);
  }

  unbindEntity<E extends StandardBaseEntity>(req: ResolveEntityOptions<E>) {
    return this.getEntityService(req).unbindEntity(req);
  }

  claimEntityOwner<E extends StandardBaseEntity>(
    ent: ResolveEntityOptions<E>,
    opts: ClaimEntityOwnerOptions,
  ): Promise<EntityResult<E>> {
    return this.getEntityService(ent).claimEntityOwner(ent, opts);
  }

  assignEntityOwner<E extends StandardBaseEntity>(
    ent: ResolveEntityOptions<E>,
    opts: AssignEntityOwnerOptions,
  ): Promise<EntityResult<E>> {
    return this.getEntityService(ent).assignEntityOwner(ent, opts);
  }

  releaseEntityOwner<E extends StandardBaseEntity>(
    ent: ResolveEntityOptions<E>,
    opts: ReleaseEntityOwnerOptions,
  ): Promise<EntityResult<E>> {
    return this.getEntityService(ent).releaseEntityOwner(ent, opts);
  }

  setEntityNotes<E extends StandardBaseEntity>(
    ent: ResolveEntityOptions<E>,
    req: SetEntityNotesOptions,
  ): Promise<EntityResult<E>> {
    return this.getEntityService(ent).setEntityNotes(ent, req);
  }
}
