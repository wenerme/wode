import { Field, InputType } from 'type-graphql';
import { RelayMutationInput } from '../relay';
import { OnConflictInput } from './OnConflictInput';

@InputType()
export class BaseCreateResourceInput extends RelayMutationInput {
  @Field(() => OnConflictInput, { nullable: true })
  onConflict?: OnConflictInput;
}
