import 'reflect-metadata';
import { FileScalar, GraphQLJSONObjectScalar, NestContainerType, RelayNode } from '@wener/nestjs/type-graphql';
import type { Constructor } from '@wener/utils';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { GraphQLString } from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import {
  buildSchema,
  registerEnumType,
  type AuthCheckerInterface,
  type BuildSchemaOptions,
  type ResolverData,
} from 'type-graphql';
import { SystemRole } from '@/graph/const';
import { getPubSub } from '@/graph/getPubSub';
import { resolveNodeType } from '@/graph/utils/resolveNodeType';
import type { GraphContext } from '@/server/yoga/createYogaServer';

export function buildGraphQLSchema(
  opts: Omit<BuildSchemaOptions, 'resolvers'> & {
    resolvers: Constructor<any>[];
  },
) {
  RelayNode.resolvers.includes(resolveNodeType) || RelayNode.resolvers.push(resolveNodeType);

  // registerEnumType(OwnerType, {
  //   name: 'OwnerType',
  // });
  // registerEnumType(SexType, {
  //   name: 'SexType',
  // });

  return buildSchema({
    container: new NestContainerType(),
    pubSub: getPubSub(),
    authChecker: ContextGraphAuthChecker,
    ...(opts as any),
    scalarsMap: [
      { type: Object, scalar: GraphQLJSONObjectScalar },
      { type: Date, scalar: GraphQLDateTime },
      { type: dayjs, scalar: GraphQLDateTime },
      // { type: Temporal.PlainDate, scalar: GraphQLDate },
      { type: BigNumber, scalar: GraphQLString },
      { type: BigInt, scalar: GraphQLString },
      { type: File, scalar: FileScalar },
      ...(opts.scalarsMap || []),
    ],
    orphanedTypes: [...(opts.orphanedTypes || [])],
  });
}

export class ContextGraphAuthChecker implements AuthCheckerInterface<GraphContext> {
  constructor() {}

  check({ root, args, context, info }: ResolverData<any>, roles: string[]) {
    if (roles.includes(SystemRole.Public)) {
      return true;
    }
    let userId = context.userId;
    if (!userId) {
      return false;
    }
    return true;
  }
}
