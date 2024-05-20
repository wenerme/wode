import { Field, InputType } from 'type-graphql';
import { GraphQLJSONScalar } from './GraphQLJSONScalar';
import { RelayMutationInput } from './relay';

@InputType()
export class GeneralRequestPayload extends RelayMutationInput {
  @Field(() => GraphQLJSONScalar, { nullable: true })
  data?: any;
}
