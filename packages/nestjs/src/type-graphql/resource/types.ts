import { Field, ID, InputType, ObjectType } from 'type-graphql';
import { RelayMutationInput, RelayMutationPayload, RelayNode } from '../relay';
import { OnConflictInput } from './OnConflictInput';

export interface PageResponse<T> {
  total: number;
  data: T[];
}

@InputType()
export class BaseResourceUpdateInput {}

@InputType()
export class BaseResourceCreateInput {}

@InputType()
export class MutationResourceInput extends RelayMutationInput {
  @Field(() => ID, { nullable: true })
  id!: string;
}

@ObjectType()
export class MutationNodePayload extends RelayMutationPayload {
  @Field(() => RelayNode)
  data!: RelayNode;
}

@ObjectType()
export class DeleteResourceInput extends MutationResourceInput {}

@InputType()
export class BaseUpdateResourceInput extends RelayMutationInput {
  @Field(() => ID)
  id!: string;
}

@InputType()
export class BaseCreateResourceInput extends RelayMutationInput {
  @Field(() => OnConflictInput, { nullable: true })
  onConflict?: OnConflictInput;
}

@InputType()
export class ResolveResourceQueryInput {
  @Field(() => ID, { nullable: true })
  id?: string;
  @Field(() => String, { nullable: true })
  uid?: string;
  @Field(() => Number, { nullable: true })
  sid?: number;
  @Field(() => String, { nullable: true })
  eid?: string;
  @Field(() => String, { nullable: true })
  cid?: string;
  @Field(() => String, { nullable: true })
  rid?: string;
  @Field(() => Boolean, { nullable: true })
  deleted?: boolean;
}
