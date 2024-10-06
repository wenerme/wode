import { ArgsType, Field } from 'type-graphql';
import { GraphQLJSONScalar } from './GraphQLJSONScalar';

@ArgsType()
export class JSONArgs {
  @Field(() => String, { nullable: true })
  path?: string;

  @Field(() => GraphQLJSONScalar, { nullable: true })
  default?: any;
}
