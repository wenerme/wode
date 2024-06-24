import { Entity } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Constructor, mixin } from '@wener/utils';
import { GraphQLScalarType } from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import {
  AuthCheckerInterface,
  buildSchema,
  BuildSchemaOptions,
  InterfaceType,
  ObjectType,
  Resolver,
  ResolverData,
} from 'type-graphql';
import { expect, test } from 'vitest';
import { StandardBaseEntity } from '../entity';
import { EntityBaseService } from '../entity/service';
import { BaseNode } from './BaseNode';
import { BaseObject } from './BaseObject';
import { resolveNodeType } from './entity';
import { FileScalar } from './FileScalar';
import { GraphQLJSONObjectScalar, GraphQLJSONScalar } from './GraphQLJSONScalar';
import { HasNotesNode, HasOwnerRefNode, HasStateStatusNode, HasTagsNode } from './interface';
import { withAuditorRefObject, withOwnerRefType, withStateStatusType } from './mixins';
import { NestContainerType } from './NestContainerType';
import { RelayNode } from './relay';
import { createBaseEntityResolver, createListPayload, withBaseQuery } from './resource';

test('build', async () => {
  expect(GraphQLJSONScalar).instanceof(GraphQLScalarType);
  // console.log(GraphQLJSONScalar instanceof GraphQLScalarType, GraphQLScalarType);
  await buildGraphQLSchema({
    resolvers: [ResourceResolver],
    scalarsMap: [
      // type-graphql 里的 graphql 和当前 graphql 不同
      // Cannot use GraphQLScalarType "JSON" from another module or realm.
      // { type: GraphQLJSONScalar, scalar: GraphQLJSONScalar },
    ],
  });
});

@InterfaceType({
  autoRegisterImplementations: false,
  implements: [BaseNode, RelayNode, HasOwnerRefNode, HasStateStatusNode],
  resolveType: (...args) => {
    return RelayNode.resolveType(...args);
  },
})
export class ResourceNode extends mixin(BaseNode, withStateStatusType, withOwnerRefType, withAuditorRefObject) {
  // @Field(() => OwnerNode, { nullable: true })
  // owner?: OwnerNode;
  //
  // @Field(() => UserObject, { nullable: true })
  // createdBy?: UserObject;
  // @Field(() => UserObject, { nullable: true })
  // updatedBy?: UserObject;
  // @Field(() => UserObject, { nullable: true })
  // deletedBy?: UserObject;
}

@ObjectType({ implements: [ResourceNode] })
export class ResourceObject extends mixin(BaseObject, withStateStatusType, withOwnerRefType, withAuditorRefObject) {
  // @Field(() => OwnerNode, { nullable: true })
  // owner?: OwnerNode;
  //
  // @Field(() => UserObject, { nullable: true })
  // createdBy?: UserObject;
  // @Field(() => UserObject, { nullable: true })
  // updatedBy?: UserObject;
  // @Field(() => UserObject, { nullable: true })
  // deletedBy?: UserObject;
}

@Entity()
class ResourceEntity extends StandardBaseEntity {}

@Injectable()
class ResourceService extends EntityBaseService<ResourceEntity> {}

@ObjectType()
class ResourceListPayload extends createListPayload(ResourceObject) {}

@Resolver(() => ResourceObject)
class ResourceResolver extends mixin(
  createBaseEntityResolver({
    ObjectType: ResourceObject,
    EntityType: ResourceEntity,
    ServiceType: ResourceService,
    ListPayloadType: ResourceListPayload,
  }),
  withBaseQuery,
) {}

export function buildGraphQLSchema(
  opts: Omit<BuildSchemaOptions, 'resolvers'> & {
    resolvers: Constructor<any>[];
  },
) {
  RelayNode.resolveType = resolveNodeType;

  // registerEnumType(OwnerType, {
  //   name: 'OwnerType',
  // });
  // registerEnumType(SexType, {
  //   name: 'SexType',
  // });

  return buildSchema({
    container: new NestContainerType(),
    // pubSub: getPubSub(),
    authChecker: ContextGraphAuthChecker,
    ...(opts as any),
    scalarsMap: [
      { type: Object, scalar: GraphQLJSONObjectScalar },
      { type: Date, scalar: GraphQLDateTime },
      // { type: dayjs, scalar: GraphQLDateTime },
      // { type: BigNumber, scalar: GraphQLString },
      { type: File, scalar: FileScalar },
      ...(opts.scalarsMap || []),
    ],
    orphanedTypes: [
      ResourceNode,
      // PrimaryResourceNode,
      ResourceObject,
      // PrimaryResourceObject,
      HasTagsNode,
      // HasLabelsNode,
      HasNotesNode,
      ...(opts.orphanedTypes || []),
    ],
  });
}

export class ContextGraphAuthChecker implements AuthCheckerInterface<{}> {
  constructor() {}

  check({ context }: ResolverData<any>, roles: string[]) {
    if (roles.includes('Public')) {
      return true;
    }
    let userId = context.userId;
    if (!userId) {
      return false;
    }
    return true;
  }
}
