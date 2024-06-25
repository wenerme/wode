import { EntityManager, EntityRepository, FindOneOptions, MikroORM, QueryBuilder } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { Errors, MaybeArray } from '@wener/utils';
import { Contexts, getCurrentUserId } from '../../app';
import { Features } from '../../Feature';
import { EntityAuditAction, writeEntityAuditLog } from '../audit';
import { EntityFeature } from '../enum';
import { HasEntityRefEntity } from '../mixins';
import { resolveEntityRef2 } from '../resolveEntityRef';
import { setOwnerRef } from '../setOwnerRef';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { createQueryBuilder } from './createQueryBuilder';
import { EntityClass } from './EntityClass';
import { findAllEntity, FindAllEntityOptions, FindAllEntityResult } from './findAllEntity';
import { hasEntityFeature } from './hasEntityFeature';
import { resolveEntity, ResolveEntityOptions, ResolveEntityResult } from './resolveEntity';
import {
  AssignEntityOwnerOptions,
  BindEntityOptions,
  ClaimEntityOwnerOptions,
  EntityResult,
  EntityService2,
  HasEntityRefService,
  HasOwnerEntityService,
  HasStatusEntityService,
  ReleaseEntityOwnerOptions,
  SetEntityStatusOptions,
} from './services';

export interface EntityServiceOptions {
  softDelete?: boolean;
}

export class BaseEntityService<E extends StandardBaseEntity>
  implements EntityService2<E>, HasStatusEntityService<E>, HasEntityRefService<E>, HasOwnerEntityService<E>
{
  readonly log = new Logger(this.constructor.name);
  protected readonly options: EntityServiceOptions = {
    softDelete: false,
  };

  constructor(
    protected readonly orm: MikroORM,
    readonly Entity: EntityClass<E>,
    readonly em: EntityManager = orm.em,
    readonly repo: EntityRepository<E> = em.getRepository(Entity),
  ) {
    // if (EntityBaseService.#services.has(Entity)) {
    //   let last = EntityBaseService.#services.get(Entity);
    //   this.log.error(
    //     `ResourceEntityService for ${Entity.name} already exists: ${last?.constructor.name} <-> ${this.constructor.name} `,
    //   );
    // } else {
    //   EntityBaseService.#services.set(Entity, this);
    //   EntityBaseService.#services.set(Entity.name, this);
    // }
  }

  async claimEntityOwner(ent: ResolveEntityOptions<E>, opts: ClaimEntityOwnerOptions): Promise<EntityResult<E>> {
    const userId = Contexts.userId.require();
    const { entity } = await this.requireEntity(ent);
    Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasOwnerRef), '资源不支持所有权');
    Errors.BadRequest.check(userId, '未能获取到当前用户信息');
    Errors.Forbidden.check(!entity.ownerId, '资源已经被分配');
    setOwnerRef(entity, userId);
    await this.em.persistAndFlush(entity);
    return { entity };
  }

  async assignEntityOwner(ent: ResolveEntityOptions<E>, opts: AssignEntityOwnerOptions): Promise<EntityResult<E>> {
    const { entity } = await this.requireEntity(ent);
    Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasOwnerRef), '资源不支持所有权');
    setOwnerRef(entity, opts.ownerId);
    await this.em.persistAndFlush(entity);
    return { entity };
  }

  async releaseEntityOwner(ent: ResolveEntityOptions<E>, opts: ReleaseEntityOwnerOptions): Promise<EntityResult<E>> {
    const { entity } = await this.requireEntity(ent);
    Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasOwnerRef), '资源不支持所有权');
    entity.ownerId = undefined;
    entity.ownerType = undefined;
    await this.em.persistAndFlush(entity);
    return { entity };
  }

  async createQueryBuilder({ em = this.em }: { em?: EntityManager } = {}): Promise<{ builder: QueryBuilder<E> }> {
    return createQueryBuilder(em, this.Entity);
  }

  async requireEntity(req: ResolveEntityOptions<E>, ext?: FindOneOptions<E>): Promise<EntityResult<E>> {
    let { entity } = await this.resolveEntity(req, ext);
    Errors.NotFound.check(entity, 'entity not found');
    return { entity };
  }

  async resolveEntity(req: ResolveEntityOptions<E>, ext?: FindOneOptions<E>): Promise<ResolveEntityResult<E>> {
    return resolveEntity(req, this, ext);
  }

  async findAllEntity(req: FindAllEntityOptions<E>): Promise<FindAllEntityResult<E>> {
    return findAllEntity(req, this);
  }

  async deleteEntity(req: ResolveEntityOptions<E>): Promise<{ entity?: E }> {
    const { em } = this;
    const { entity } = await this.resolveEntity(req);
    if (!entity) {
      return {};
    }

    entity.deletedAt = new Date();
    if (hasEntityFeature(entity, EntityFeature.HasAuditorRef)) {
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

  undeleteEntity(req: ResolveEntityOptions<E>): Promise<{ entity?: E }> {
    return this.em.transactional(async (em) => {
      const { entity } = await this.resolveEntity(req);
      if (!entity) {
        return {};
      }

      entity.deletedAt = undefined;
      if (hasEntityFeature(entity, EntityFeature.HasAuditorRef)) {
        entity.deletedById = undefined;
      }

      writeEntityAuditLog({
        entity,
        action: EntityAuditAction.Undelete,
        em,
      });
      await em.persistAndFlush(entity);
      return { entity };
    });
  }

  purgeEntity(req: ResolveEntityOptions<E>): Promise<{ entity?: E }> {
    return this.em.transactional(async (em) => {
      const { entity } = await this.resolveEntity(req);
      if (!entity) {
        return {};
      }

      writeEntityAuditLog({
        entity,
        action: EntityAuditAction.Purge,
        em,
        before: entity.toPOJO(),
      });
      await em.removeAndFlush(entity);
      return { entity };
    });
  }

  hasFeature(code: MaybeArray<string>) {
    return Features.hasFeature(this.Entity, code);
  }

  async bindEntity(ent: ResolveEntityOptions<E>, ref: BindEntityOptions) {
    const { entity } = await this.requireEntity(ent);

    Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasEntityRef), '资源不支持绑定');

    const { entityId, entityType, entity: entityRef } = await resolveEntityRef2(ref);
    entity.entityId = entityId;
    entity.entityType = entityType;
    // todo check entity type valid

    return { entity, ref: entityRef };
  }

  async unbindEntity(req: ResolveEntityOptions<E>) {
    const { entity } = await this.requireEntity(req);

    Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasEntityRef), '资源不支持解绑');

    const ent = entity as HasEntityRefEntity;
    ent.entityId = undefined;
    ent.entityType = undefined;

    return { entity };
  }

  async setEntityStatus(ent: ResolveEntityOptions<E>, opts: SetEntityStatusOptions) {
    const { entity } = await this.requireEntity(ent);
    Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasStateStatus), '资源不支持状态');
    entity.status = opts.status;
    await this.em.persistAndFlush(entity);
    return { entity };
  }
}
