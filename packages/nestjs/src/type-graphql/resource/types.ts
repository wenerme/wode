import { Field, InputType } from 'type-graphql';

export interface PageResponse<T> {
  total: number;
  data: T[];
}

@InputType()
export class BaseResourceUpdateInput {}

@InputType()
export class BaseResourceCreateInput {}

// @ObjectType()
// export class CreateResourcePayload extends RelayMutationPayload {}
//
// @ObjectType()
// export class UpdateResourcePayload extends RelayMutationPayload {}
//
// @ObjectType()
// export class DeleteResourcePayload extends RelayMutationPayload {}
//
// @ObjectType()
// export class MutationResourcePayload extends RelayMutationPayload {}

@InputType()
export class ResolveResourceQueryInput {
  @Field(() => String, { nullable: true })
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
