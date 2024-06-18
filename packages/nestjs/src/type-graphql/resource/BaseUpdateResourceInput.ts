import { Field, ID, InputType } from 'type-graphql';
import { RelayMutationInput } from '../relay';

@InputType()
export class BaseUpdateResourceInput extends RelayMutationInput {
  @Field(() => ID)
  id!: string;
}
