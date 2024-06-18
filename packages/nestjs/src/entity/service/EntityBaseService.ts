import { EntityData, LockMode, type RequiredEntityData } from '@mikro-orm/core';
import { QueryBuilder, type EntityManager, type EntityRepository, type MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { Errors } from '@wener/utils';
import { Contexts, getCurrentTenantId, getCurrentUserId } from '../../app';
import { getEntityManager, getMikroORM } from '../../mikro-orm';
import { EntityAuditAction, writeEntityAuditLog } from '../audit';
import { setData } from '../setData';
import { setOwnerRef } from '../setOwnerRef';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { applyListQuery } from './applyListQuery';
import { applyQueryFilter } from './applyQueryFilter';
import { applyResolveQuery, applySelection } from './applyResolveQuery';
import { applySearch } from './applySearch';
import { resolveEntity, ResolveEntityOptions } from './resolveEntity';
import { EntityService } from './services';
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

interface UserAuditableBaseEntity extends StandardBaseEntity {
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
}

interface OwnableBaseEntity {
  ownerId?: string;
  ownerType?: string;
  ownerUser?: StandardBaseEntity;
  ownerTeam?: StandardBaseEntity;
}

interface StatefulBaseEntity extends StandardBaseEntity {
  state: string;
  status: string;
}

interface EntityServiceOptions {
  softDelete?: boolean;
}

export class EntityBaseService<E extends StandardBaseEntity> implements EntityService<E> {
  protected readonly log = new Logger(this.constructor.name);

  protected readonly options: EntityServiceOptions = {
    softDelete: false,
  };

  constructor(
    protected readonly orm: MikroORM,
    readonly Entity: EntityClass<E>,
    readonly em: EntityManager = orm.em,
    readonly repo: EntityRepository<E> = em.getRepository(Entity),
  ) {
    if (EntityBaseService.#services.has(Entity)) {
      let last = EntityBaseService.#services.get(Entity);
      this.log.error(
        `ResourceEntityService for ${Entity.name} already exists: ${last?.constructor.name} <-> ${this.constructor.name} `,
      );
    } else {
      EntityBaseService.#services.set(Entity, this);
      EntityBaseService.#services.set(Entity.name, this);
    }
  }

  static #services = new Map<EntityClass<any> | string, EntityBaseService<any>>();

  static getService<T>(entity: EntityClass<T> | string) {
    return this.#services.get(entity) as T;
  }

  static requireService<T extends StandardBaseEntity>(entity: EntityClass<T>): EntityBaseService<T> {
    return this.#services.get(entity) || new EntityBaseService(getMikroORM(), entity);
  }

  protected applySearch<T extends QueryBuilder<E>>({ builder, search }: { builder: T; search: string }): T {
    applySearch({
      search,
      builder,
    });
    return builder;
  }

  protected applyResolve<T extends QueryBuilder<E>, Q extends ResolveEntityRequest>({
    builder,
    query,
  }: {
    builder: T;
    query: Q;
  }): boolean {
    return applyResolveQuery({ builder, query });
  }

  async resolve(req: ResolveEntityRequest & { [key: string]: any }): Promise<E | null> {
    let { builder } = await this.createQueryBuilder();
    if (!this.applyResolve({ builder, query: req })) {
      return null;
    }

    builder = applySelection({ builder, query: req });
    let found = await builder.getSingleResult();
    if (found && req.include?.length) {
      await this.em.populate(found, req.include as never[]);
    }
    if (!found) {
      this.log.log(`resolve not found ${this.Entity.name} ${JSON.stringify(req)}`);
    }
    return found;
  }

  applyListQuery<T extends QueryBuilder<E>, Q extends ListEntityRequest>({ builder, query }: { builder: T; query: Q }) {
    builder = applyListQuery({ builder, query });
    applyQueryFilter({ builder, query });
    {
      const search = query.search?.trim();
      if (search) {
        builder = this.applySearch({ builder, search });
      }
    }
  }

  async list(req: ListEntityRequest): Promise<{ total: number; data: E[] }> {
    let { builder } = await this.createQueryBuilder();
    this.applyListQuery({ builder, query: req });

    const [data, total] = await builder.getResultAndCount();

    if (data && req.include?.length) {
      await this.em.populate(data, req.include as never[]);
    }

    return { data, total };
  }

  // async findByCursor(req: ListEntityRequest): Promise<{ total: number; items: E[] }> {
  //   let { builder } = await this.readBuilder();
  //   this.applyListQuery({ builder, query: req });
  //
  //   const [data, total] = await builder.getResultAndCount();
  //
  //   if (data && req.include?.length) {
  //     await this.em.populate(data, req.include as never[]);
  //   }
  //
  //   return { items: data, total };
  // }

  async find(req: ListEntityRequest): Promise<E[]> {
    let { builder } = await this.createQueryBuilder();
    this.applyListQuery({ builder, query: req });

    const data = await builder.getResult();

    if (data && req.include?.length) {
      await this.em.populate(data, req.include as never[]);
    }

    return data;
  }

  async count(query: CountEntityRequest): Promise<number> {
    let { builder } = await this.createQueryBuilder();
    this.applyListQuery({ builder, query: query });

    return await builder.getCount();
  }

  protected async createQueryBuilder(): Promise<{ builder: QueryBuilder<E> }> {
    return createQueryBuilder(this.em, this.Entity);
  }

  async getEntity(
    req: GetEntityRequest,
    {
      build,
      lockMode,
    }: {
      build?: (builder: QueryBuilder<E>) => void;
      lockMode?: LockMode;
    } = {},
  ) {
    const { id } = req;
    let { builder } = await this.createQueryBuilder();

    Errors.BadRequest.check(id, 'id is required');
    builder.andWhere({
      id,
    });

    builder = applySelection({ builder, query: req });
    if (lockMode) {
      builder.setLockMode(lockMode);
    }
    if (build) {
      build(builder);
    }
    const entity = await builder.getSingleResult();
    Errors.NotFound.check(entity, 'entity not found');

    if (entity && req.include?.length) {
      await this.em.populate(entity, req.include as never[]);
    }

    return entity;
  }

  async get(req: GetEntityRequest) {
    return this.getEntity(req);
  }

  async create(req: CreateEntityRequest & { data: RequiredEntityData<E> }) {
    const { repo, em } = this;
    let entity: E;
    const { data, upsert } = req;
    (data as any).tid = getCurrentTenantId();
    if (upsert) {
      const { onConflictFields, onConflictExcludeFields = [], onConflictMergeFields, onConflictAction } = req;
      try {
        entity = await this.em.upsert(this.Entity, data as any, {
          onConflictFields,
          onConflictMergeFields,
          onConflictExcludeFields: [...onConflictExcludeFields, 'id', 'uid', 'tid', 'createdAt', 'deletedAt'],
          onConflictAction,
        });
      } catch (e) {
        this.log.error(`[${getCurrentTenantId()}] upsert ${this.Entity.name} ${JSON.stringify(req)} ${e}`);
        throw e;
      }
      writeEntityAuditLog({
        entity,
        action: EntityAuditAction.Upsert,
        before: data,
        em,
      });
    } else {
      entity = repo.create(data as any);
      await em.persistAndFlush(entity);
      writeEntityAuditLog({
        entity,
        action: EntityAuditAction.Create,
        after: entity.toPOJO(),
      });
      await em.flush();
    }

    return entity;
  }

  async update(req: UpdateEntityRequest & { data: Partial<E> }) {
    let { data } = req;
    const { repo, em } = this;
    const entity = await this.get(req);
    const before = entity.toPOJO();
    entity.assign(trimUndefined(data));
    writeEntityAuditLog({
      entity,
      action: EntityAuditAction.Update,
      em,
      before,
      after: entity.toPOJO(),
    });
    await em.persistAndFlush(entity);
    return entity;
  }

  async patch(req: PatchEntityRequest) {
    return this.em.transactional(async (em) => {
      const { data } = req;
      const entity = await this.getEntity(req, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
      });
      const before = entity.toPOJO();
      {
        const { attributes, properties, extensions, ...rest } = data as EntityData<StatefulBaseEntity>;
        entity.assign(rest as any);
        entity.attributes = setData(entity.attributes, { data: attributes, partial: true });
        entity.properties = setData(entity.properties, { data: properties, partial: true });
        entity.extensions = setData(entity.extensions, { data: extensions, partial: true });
      }
      writeEntityAuditLog({
        entity,
        action: EntityAuditAction.Patch,
        em,
        before,
        after: entity.toPOJO(),
      });
      await em.persistAndFlush(entity);
      return entity;
    });
  }

  async requireEntity(req: { entity?: E; id?: string }): Promise<{ entity: E }> {
    let { entity } = await this.resolveEntity(req);
    Errors.NotFound.check(entity, 'entity not found');
    return { entity };
  }

  async resolveEntity(req: ResolveEntityOptions<E>): Promise<{ entity?: E | null }> {
    return resolveEntity(req, this);
  }

  hasFeature(code: string) {}

  async deleteEntity(req: ResolveEntityOptions<E>): Promise<{ entity?: E }> {
    const { em } = this;
    const { entity } = await this.resolveEntity(req);
    if (!entity) {
      return {};
    }

    entity.deletedAt = new Date();
    if (isUserAuditableBaseEntity(entity)) {
      entity.deletedById = getCurrentUserId();
    }

    if (this.options.softDelete) {
      em.persist(entity);
    } else {
      em.remove(entity);
    }

    writeEntityAuditLog({
      entity,
      action: EntityAuditAction.Delete,
      em,
    });
    await em.flush();
    return { entity };
  }

  async delete(r: DeleteEntityRequest): Promise<GeneralResponse<E>> {
    const { repo, em } = this;
    // todo 允许不存在
    const entity = await this.resolve(r);
    if (!entity) {
      this.log.warn(`delete not found ${this.Entity.name} ${JSON.stringify(r)}`);
      return {
        status: 200,
        message: '资源不存在',
      };
    }
    // fixme 临时关闭 softDelete
    if (this.options.softDelete) {
      entity.deletedAt = new Date();
      if (isUserAuditableBaseEntity(entity)) {
        entity.deletedById = getCurrentUserId();
      }
      em.persist(entity);
    } else {
      em.remove(entity);
    }

    writeEntityAuditLog({
      entity,
      action: EntityAuditAction.Delete,
      em,
    });
    await em.flush();
    return {
      status: 200,
      message: '已删除',
      data: entity,
    };
  }

  async undelete(r: UndeleteEntityRequest) {
    const { repo, em } = this;
    const entity = await this.get({ ...r, deleted: true });
    entity.deletedAt = undefined;
    if (isUserAuditableBaseEntity(entity)) {
      entity.deletedById = undefined;
    }
    writeEntityAuditLog({
      entity,
      action: EntityAuditAction.Undelete,
      em,
    });
    await em.persistAndFlush(entity);
    return entity;
  }

  async purge(r: PurgeEntityRequest) {
    const { repo, em } = this;
    const entity = await this.get({ ...r, deleted: true });
    writeEntityAuditLog({
      entity,
      action: EntityAuditAction.Purge,
      em,
      before: entity.toPOJO(),
    });
    await em.removeAndFlush(entity);
    return entity;
  }

  async import(req: ImportEntityRequest) {
    const { data, onConflictFields, onConflictMergeFields, onConflictExcludeFields = [], onConflictAction } = req;
    const { em } = this;
    // static
    if (getCurrentTenantId()) {
      data.forEach((v) => {
        v.tid = getCurrentTenantId();
      });
    }
    this.log.log(`Import tid=${Contexts.tenantId.get()} ${data.length} ${this.Entity.name}`);
    const entities = await em.transactional(async (em) => {
      const entities = await em.upsertMany(this.Entity, data, {
        onConflictFields,
        onConflictMergeFields,
        onConflictExcludeFields: [...onConflictExcludeFields, 'id', 'tid', 'createdAt', 'deletedAt'],
        onConflictAction,
      });
      return entities;
    });
    return {
      total: entities.length,
    };
  }

  async claimOwner({ ...req }: ClaimOwnerRequest): Promise<ClaimOwnerResponse> {
    const userId = Contexts.userId.require();
    const ent = await this.get(req);
    Errors.BadRequest.check(isOwnableBaseEntity(ent), '资源不支持归属');
    Errors.Forbidden.check(!ent.ownerId, '资源已经被分配');
    setOwnerRef(ent, userId);
    await this.em.persistAndFlush(ent);
    return {
      data: ent,
    };
  }

  async assignOwner({ ownerId, ...req }: AssignOwnerRequest): Promise<AssignOwnerResponse> {
    const userId = Contexts.userId.require();
    const ent = await this.get(req);
    Errors.BadRequest.check(isOwnableBaseEntity(ent), '资源不支持归属');
    setOwnerRef(ent, ownerId);
    await this.em.persistAndFlush(ent);
    return {
      data: ent,
    };
  }

  async releaseOwner({ ...req }: ReleaseOwnerRequest): Promise<ReleaseOwnerResponse> {
    const userId = Contexts.userId.require();
    const ent = await this.get(req);
    Errors.BadRequest.check(isOwnableBaseEntity(ent), '资源不支持归属');
    Errors.Forbidden.check(ent.ownerId === userId, '资源不属于当前用户');
    setOwnerRef(ent, null);
    await this.em.persistAndFlush(ent);
    return {
      data: ent,
    };
  }

  // async setEntityState<T extends StatefulBaseEntity>(
  //   entity: T,
  //   {
  //     state,
  //     status,
  //   }: {
  //     status?: string;
  //     state?: string;
  //   },
  // ) {
  //   if (!status && !state) {
  //     return false;
  //   }
  //   if (state && entity.state === state && !status) {
  //     return false;
  //   }
  //   if (status && entity.status === status) {
  //     return false;
  //   }
  //
  //   // fixme resolve state & status from db
  //
  //   entity.state = state || entity.state;
  //   entity.status = status || entity.status;
  //   return true;
  // }
}

function resolveState<T extends StatefulBaseEntity>(
  entity: T,
  {
    state = entity.state,
    status = entity.status,
  }: {
    status?: string;
    state?: string;
  },
) {
  const em = getEntityManager();
  if ('StateEntity' in entity) {
    const StateEntity = entity.StateEntity as EntityClass<any>;
    if (StateEntity) {
      const repo = em.getRepository(StateEntity);
      repo.findAll();
    }
  }
}

export type EntityClass<T> = Function & {
  prototype: T;

  StateEntity?: EntityClass<any>;
  StatusEntity?: EntityClass<any>;
};

function isOwnableBaseEntity(entity: any): entity is OwnableBaseEntity {
  return 'ownerId' in entity;
}

function isUserAuditableBaseEntity(entity: any): entity is UserAuditableBaseEntity {
  return 'createdById' in entity;
}

function findByCursor<E extends EntityClass<any>>(o: {
  em: EntityManager;
  builder: QueryBuilder<E>;
  cursor: { first?: number; after?: string; last?: number; before?: string };
}) {
  // https://github.com/mikro-orm/mikro-orm/blob/master/packages/core/src/utils/Cursor.ts
}

function trimUndefined(o: any) {
  for (const k in o) {
    if (o[k] === undefined) {
      delete o[k];
    }
  }
  return o;
}

export async function createQueryBuilder<E extends StandardBaseEntity>(
  em: EntityManager,
  Entity: EntityClass<E>,
): Promise<{
  builder: QueryBuilder<E>;
}> {
  // 使用 qb 必须手动 applyFilter
  // 让 TidFilter 生效
  const builder = em.createQueryBuilder(Entity, undefined, undefined, {
    // enabled: getDatabaseContext().debug,
  });
  let cond = await em.applyFilters<E>(Entity.name, {}, {}, 'read');
  cond && builder.andWhere(cond);
  // await builder will execute
  return { builder };
}
