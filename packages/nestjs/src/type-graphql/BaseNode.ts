import { Field, ID, InterfaceType } from 'type-graphql';
import { GraphQLJSONScalar } from './GraphQLJSONScalar';
import { RelayNode } from './relay';

@InterfaceType({
  autoRegisterImplementations: false,
  implements: [RelayNode],
  resolveType: (...args) => {
    return RelayNode.resolveType(...args);
  },
})
export class BaseNode implements RelayNode {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  uid!: string;

  @Field(() => String, { nullable: true })
  eid?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  @Field(() => GraphQLJSONScalar, { nullable: true })
  attributes?: Record<string, any>;

  @Field(() => GraphQLJSONScalar, { nullable: true })
  properties?: Record<string, any>;
}
