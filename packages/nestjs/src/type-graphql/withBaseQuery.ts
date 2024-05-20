import { Injectable } from '@nestjs/common';
import { Arg, Args, Authorized, Ctx, FieldResolver, Query, Resolver, Root } from 'type-graphql';
import { BaseEntityResolverConstructor, GetArgs } from './createBaseEntityResolver';
import { GraphQLJSONScalar } from './GraphQLJSONScalar';
import { JSONArgs } from './JSONArgs';
import { ListQueryInput } from './ListQueryInput';
import { resolveGraphQLJSON } from './resolveGraphQLJSON';

export function withBaseQuery<TBase extends BaseEntityResolverConstructor<any, any, any>>(Base: TBase) {
  @Injectable()
  @Resolver(Base.ObjectType)
  class BaseQuery extends Base {
    @Authorized()
    @Query(() => Base.ListPayloadType, {
      name: `find${Base.ObjectName}`,
    })
    async findAll(
      @Arg('query', () => ListQueryInput, {
        nullable: true,
        defaultValue: {},
      })
      input: ListQueryInput,
    ) {
      const { total, data } = await this.svc.list(input);
      return { total, data };
    }

    @Authorized()
    @Query(() => Base.ObjectType, { name: `get${Base.ObjectName}` })
    async get(@Args(() => GetArgs) args: GetArgs, @Ctx() ctx: any) {
      return this.svc.get(args);
    }

    @FieldResolver(() => GraphQLJSONScalar, { nullable: true })
    attributes(@Root() root: any, @Args(() => JSONArgs) args: JSONArgs) {
      return resolveGraphQLJSON((root as any)?.attributes, args);
    }

    @FieldResolver(() => GraphQLJSONScalar, { nullable: true })
    properties(@Root() root: any, @Args(() => JSONArgs) args: JSONArgs) {
      return resolveGraphQLJSON((root as any)?.properties, args);
    }
  }

  return BaseQuery;
}
