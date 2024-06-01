import { Injectable } from '@nestjs/common';
import type { GraphQLResolveInfo } from 'graphql/type';
import { Arg, Args, Authorized, Ctx, FieldResolver, Info, Query, Resolver, Root } from 'type-graphql';
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
      @Info() info: GraphQLResolveInfo,
    ) {
      const fields =
        info.fieldNodes[0].selectionSet?.selections.map((selection) => (selection as any).name.value) || [];
      let includeTotal = fields.includes('total');
      let includeData = fields.includes('data');
      if (includeTotal && !includeData) {
        const total = await this.svc.count(input);
        return { total, data: [] };
      }
      if (!includeTotal && includeData) {
        const data = await this.svc.find(input);
        return { total: 0, data };
      }
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
