import { MikroORM, type EntityManager, type EntityRepository } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Constructor } from '@wener/utils';
import { Resolver } from 'type-graphql';
import type { StandardBaseEntity } from '../../entity';
import { EntityBaseService } from '../../entity/service';
import type { BaseObject } from '../BaseObject';
import { getObjectName } from '../getObjectName';
import type { EntityClass, ObjectClass } from '../types';
import { createListPayload } from './createListPayload';
import type { PageResponse } from './types';

export interface BaseEntityResolver<O, E extends StandardBaseEntity, SVC extends EntityBaseService<E>> {
  readonly EntityType: EntityClass<E>;
  readonly ObjectType: ObjectClass<O>;

  readonly em: EntityManager;
  readonly repo: EntityRepository<E>;
  readonly svc: SVC;
}

type BaseEntityResolverStatic<O, E extends StandardBaseEntity, SVC extends EntityBaseService<E>> = {
  ObjectType: Constructor<O>;
  ListPayloadType: Constructor<PageResponse<O>>;
  EntityType: EntityClass<E>;
  ServiceType?: Constructor<SVC>;

  ObjectName: string;
};

export type BaseEntityResolverConstructor<
  O = BaseObject,
  E extends StandardBaseEntity = StandardBaseEntity,
  SVC extends EntityBaseService<E> = EntityBaseService<E>,
> = Constructor<BaseEntityResolver<O, E, SVC>> & BaseEntityResolverStatic<O, E, SVC>;

export function createBaseEntityResolver<
  O extends object,
  E extends StandardBaseEntity,
  SVC extends EntityBaseService<E>,
>({
  ObjectType,
  EntityType,
  ServiceType,
  ListPayloadType,
}: {
  ObjectType: Constructor<O>;
  EntityType: Constructor<E>;
  // InputType?: Constructor<O>;
  ListPayloadType?: Constructor<PageResponse<O>>;
  ServiceType?: Constructor<SVC>;
}): BaseEntityResolverConstructor<O, E, SVC> {
  @Injectable()
  @Resolver(ObjectType)
  class BaseEntityResolver {
    protected readonly log = new Logger(this.constructor.name);
    static ObjectName = getObjectName(ObjectType);
    static EntityType: Constructor<E> = EntityType;
    static ObjectType: Constructor<O> = ObjectType;
    static ServiceType?: Constructor<SVC> = ServiceType;
    static ListPayloadType: Constructor<PageResponse<O>> = ListPayloadType || createListPayload(ObjectType);

    readonly EntityType: EntityClass<E> = EntityType;
    readonly ObjectType: ObjectClass<O> = ObjectType;
    readonly em: EntityManager;
    readonly repo: EntityRepository<E>;
    protected _svc?: SVC;

    constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {
      this.EntityType = EntityType;
      this.ObjectType = ObjectType;
      this.em = orm.em;
      this.repo = this.em.getRepository(this.EntityType);
    }

    get svc(): SVC {
      return (this._svc ??= EntityBaseService.requireService(this.EntityType) as unknown as SVC);
    }
  }

  return BaseEntityResolver;
}
