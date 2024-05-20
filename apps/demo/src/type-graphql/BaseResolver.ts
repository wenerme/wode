import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AbstractConstructor, Constructor } from '@wener/nestjs';
import { Args, Ctx, FieldResolver, Query, Resolver, Root } from 'type-graphql';
import { GraphQLJSONScalar } from './GraphQLJSONScalar';
import { JSONArgs } from './JSONArgs';
import { PageRequestArg } from './PageRequestArg';
import { PageResponseOf } from './PageResponse';
import { computeIfAbsent } from './computeIfAbsent';
import { getTypeCache } from './getTypeCache';
import { normalizePagination } from './normalizePagination';
import { resolveGraphQLJSON } from '@wener/nestjs/type-graphql';
import { EntityClass, ObjectClass, PageResponse } from './types';

export interface BaseResolver<O, E> {
  readonly EntityType: EntityClass<E>;
  readonly ObjectType: ObjectClass<O>;
  readonly em: EntityManager;
  readonly repo: EntityRepository<E>;

  findAll(page: PageRequestArg): Promise<PageResponse<O>>;
}

export function BaseResolverOf<O extends object, E extends object>({
  ObjectType,
  EntityType,
  InputType,
  PageResponseType = PageResponseOf(ObjectType),
}: {
  ObjectType: Constructor<O>;
  EntityType: EntityClass<E>;
  InputType?: Constructor<O>;
  PageResponseType?: Constructor<PageResponse<O>>;
  ServiceType?: Constructor<any>;
}): AbstractConstructor<BaseResolver<O, E>> {
  const name = `Abstract${ObjectType.name}Resolver`;
  return computeIfAbsent(getTypeCache(), name, () => {
    let objectName = getObjectName(ObjectType);
    let inputName = InputType?.name.replace(/Input$/, '');

    @Injectable()
    @Resolver(ObjectType)
    abstract class AbstractBaseResolver {
      protected readonly log = new Logger(this.constructor.name);
      readonly EntityType: EntityClass<E>;
      readonly ObjectType: ObjectClass<O>;
      readonly em: EntityManager;
      readonly repo: EntityRepository<E>;

      protected constructor(@Inject(MikroORM) protected readonly orm: MikroORM) {
        this.EntityType = EntityType;
        this.ObjectType = ObjectType;
        this.em = orm.em;
        this.repo = this.em.getRepository(this.EntityType);
      }

      @Query((returns) => PageResponseType, { name: `find${objectName}` })
      async findAll(@Args(() => PageRequestArg) page: PageRequestArg, @Ctx() ctx): Promise<PageResponse<O>> {
        const { limit, offset } = normalizePagination(page);
        const builder = this.repo.qb();

        builder.limit(limit).offset(offset);

        const [data, total] = await this.repo.findAndCount({});
        return {
          total: total,
          data: data,
        };
      }

      @FieldResolver(() => GraphQLJSONScalar, { nullable: true })
      attributes(@Root() root: O, @Args(() => JSONArgs) args: JSONArgs) {
        return resolveGraphQLJSON((root as any)?.attributes, args);
      }

      @FieldResolver(() => GraphQLJSONScalar, { nullable: true })
      properties(@Root() root: O, @Args(() => JSONArgs) args: JSONArgs) {
        return resolveGraphQLJSON((root as any)?.properties, args);
      }
    }

    return AbstractBaseResolver;
  });
}

export function getObjectName<T extends object>(ObjectType: Constructor<T>) {
  return ObjectType.name.replace(/Object$/, '');
}
