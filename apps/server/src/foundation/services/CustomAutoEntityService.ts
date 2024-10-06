import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { Features } from '@wener/nestjs';
import {
  EntityFeature,
  type HasNotesEntity,
  type IdentifiableEntity,
  type StandardBaseEntity,
} from '@wener/nestjs/entity';
import { AutoEntityService, hasEntityFeature, type ResolveEntityOptions } from '@wener/nestjs/entity/service';
import { Errors } from '@wener/utils';

@Injectable()
export class CustomAutoEntityService extends AutoEntityService {
  constructor(
    @Inject(MikroORM) readonly orm: MikroORM,
    @Inject(EntityManager) readonly em: EntityManager = orm.em,
  ) {
    super(orm, em);
  }

  async bindUser<E extends StandardBaseEntity>(ent: ResolveEntityOptions<E>, opts: BindEntityUserOptions) {
    let es = this.getEntityService(ent);

    const { entity } = await es.requireEntity(ent);

    Errors.BadRequest.check(hasEntityFeature2(entity, EntityFeature2.HasUser), '资源不支持绑定用户');

    const { entity: user } = await this.resolveEntity({
      id: opts.userId,
    });

    entity.user = user;
    await this.em.persistAndFlush(entity);

    return { entity, user };
  }

  async unbindUser<E extends StandardBaseEntity>(req: ResolveEntityOptions<E>, opts: UnbindEntityUserOptions) {
    const { entity } = await this.requireEntity(req);

    Errors.BadRequest.check(hasEntityFeature2(entity, EntityFeature2.HasUser), '资源不支持绑定用户');

    if (entity.user?.id && entity.user.id !== opts.userId) {
      Errors.BadRequest.throw('资源不属于指定用户');
    }

    entity.user = undefined;
    await this.em.persistAndFlush(entity);

    return {
      entity,
    };
  }

  async bindCustomer<E extends StandardBaseEntity>(ent: ResolveEntityOptions<E>, opts: BindCustomerOptions) {
    let es = this.getEntityService(ent);

    const { entity } = await es.requireEntity(ent);

    Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasCustomer), '资源不支持绑定客户');

    const { entity: target } = await this.resolveEntity({
      id: opts.customerId,
    });

    entity.customer = target;
    await this.em.persistAndFlush(entity);

    return { entity, target };
  }

  async unbindCustomer<E extends StandardBaseEntity>(req: ResolveEntityOptions<E>, opts: UnbindCustomerOptions) {
    const { entity } = await this.requireEntity(req);

    Errors.BadRequest.check(hasEntityFeature(entity, EntityFeature.HasCustomer), '资源不支持绑定客户');

    if (entity.customerId) {
      return {
        entity,
      };
    }
    const before = entity.customer;
    entity.customer = undefined;
    await this.em.persistAndFlush(entity);

    return {
      entity,
      before,
    };
  }

  async setEntityNotes<E extends StandardBaseEntity>(ent: ResolveEntityOptions<E>, opts: SetEntityNotesOptions) {
    let es = this.getEntityService(ent);
    let { entity } = await es.requireEntity(ent);
    Errors.BadRequest.check(hasEntityFeature2(entity, EntityFeature.HasNotes), '资源不支持所有权');
    entity.notes = opts.notes;
    await this.em.persistAndFlush(entity);
    return {
      entity,
    };
  }
}

export type SetEntityNotesOptions = {
  notes: string;
};

type FeatureTypes = {
  [EntityFeature.HasNotes]: HasNotesEntity;
  [EntityFeature2.HasUser]: HasUserEntity;
};

enum EntityFeature2 {
  HasUser = 'HasUser',
}

export function hasEntityFeature2<E, F extends keyof FeatureTypes>(
  entity: E, // maybe constructor
  feature: F,
): entity is E & FeatureTypes[F] {
  return Features.hasFeature(entity, feature);
}

interface BindCustomerOptions {
  customerId: string;
}

interface UnbindCustomerOptions {}

interface BindEntityUserOptions {
  userId: string;
}

interface UnbindEntityUserOptions {
  userId?: string;
}

interface HasUserEntity {
  user?: IdentifiableEntity | null;
}
