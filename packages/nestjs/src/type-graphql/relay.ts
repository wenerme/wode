import { Field, ID, InputType, InterfaceType, ObjectType, type TypeResolver } from 'type-graphql';

export { runRelayClientMutation } from './runRelayClientMutation';

export type RelayConnectionCursor = string;

/*
https://github.com/graphql/graphql-relay-js/blob/main/src/connection/connection.ts
 */

@InterfaceType('Node', {
  autoRegisterImplementations: false,
  description: 'An object with a global ID.',
  resolveType: (...args) => {
    return RelayNode.resolveType(...args);
  },
})
export abstract class RelayNode {
  @Field((type) => ID)
  id!: string;

  static resolvers: TypeResolver<any, any>[] = [];

  static resolveType: TypeResolver<any, any> = async (...args) => {
    for (const resolver of RelayNode.resolvers) {
      const resolved = await resolver(...args);
      if (resolved) {
        return resolved;
      }
    }
    const [value] = args;
    throw new Error(`Unknown node type ${value}`);
  };
}

@InputType()
export abstract class RelayMutationInput {
  @Field(() => ID, { nullable: true })
  clientMutationId?: string;
}

@ObjectType()
export abstract class RelayMutationPayload {
  @Field(() => ID, { nullable: true })
  clientMutationId?: string;
}

@ObjectType('PageInfo', { description: 'Information about pagination in a connection.' })
export class RelayPageInfo {
  @Field(() => String, {
    nullable: true,
    description: 'When paginating backwards, the cursor to continue.',
  })
  readonly startCursor?: RelayConnectionCursor | null;

  @Field(() => String, {
    nullable: true,
    description: 'When paginating forwards, the cursor to continue.',
  })
  readonly endCursor?: RelayConnectionCursor | null;

  @Field(() => Boolean, {
    nullable: true,
    description: 'When paginating backwards, are there more items?',
  })
  readonly hasPreviousPage!: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'When paginating forwards, are there more items?',
  })
  readonly hasNextPage!: boolean;
}

/**
 * A type designed to be exposed as a `Connection` over GraphQL.
 */
export interface RelayConnection<T> {
  edges: Array<RelayEdge<T>>;
  pageInfo: RelayPageInfo;
}

/**
 * A type designed to be exposed as a `Edge` over GraphQL.
 */
export interface RelayEdge<T> {
  node: T;
  cursor: RelayConnectionCursor;
}
