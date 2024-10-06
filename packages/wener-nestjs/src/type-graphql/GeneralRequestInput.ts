import { GraphQLJSON } from 'graphql-scalars';
import { Field, InputType } from 'type-graphql';
import { RelayMutationInput } from './relay';

@InputType()
export class GeneralRequestInput extends RelayMutationInput {
  @Field(() => GraphQLJSON, { nullable: true })
  data?: any;
}
