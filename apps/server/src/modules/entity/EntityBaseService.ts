import type { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/postgresql';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { StandardBaseEntity } from '../../entity/base/StandardBaseEntity';

export class EntityBaseService<E extends StandardBaseEntity> {
  protected readonly log = new Logger(this.constructor.name);

  constructor(
    protected readonly orm: MikroORM,
    protected readonly Entity: EntityClass<E>,
    protected readonly em: EntityManager = orm.em,
    protected readonly repo: EntityRepository<E> = em.getRepository(Entity),
  ) {
    if (EntityBaseService.#services.has(Entity)) {
      this.log.error(`ResourceEntityService for ${Entity.name} already exists`);
    } else {
      EntityBaseService.#services.set(Entity, this);
      EntityBaseService.#services.set(Entity.name, this);
    }
  }

  static #services = new Map<EntityClass<any> | string, EntityBaseService<any>>();

  static getService<T>(entity: EntityClass<T> | string) {
    return this.#services.get(entity);
  }

  protected applySearch<T extends QueryBuilder<E>>({ builder, search }: { builder: T; search: string }): T {
    return builder;
  }
}

export type EntityClass<T> = Function & {
  prototype: T;

  StateEntity?: EntityClass<any>;
  StatusEntity?: EntityClass<any>;
};
