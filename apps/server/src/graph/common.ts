import { RelayMutationInput, RelayMutationPayload } from '@wener/nestjs/type-graphql';
import { ArgsType, Field, ID, InputType, ObjectType } from 'type-graphql';

@ArgsType()
export class ResolveArgs {
  @Field((type) => ID, { nullable: true })
  id?: string;
  @Field((type) => String, { nullable: true })
  uid?: string;
  @Field((type) => Number, { nullable: true })
  sid?: number;
  @Field((type) => String, { nullable: true })
  eid?: string;
  @Field((type) => String, { nullable: true })
  cid?: string;
  @Field((type) => String, { nullable: true })
  rid?: string;
  @Field((type) => Boolean, { nullable: true })
  deleted?: boolean;
}

@ArgsType()
export class GetArgs {
  @Field((type) => ID, { nullable: true })
  id!: string;
}

@ArgsType()
export class DeleteArgs {
  @Field((type) => ID, { nullable: true })
  id!: string;
}

@InputType()
export class DeleteEntityInput extends RelayMutationInput {
  @Field((type) => ID, { nullable: false })
  id!: string;
}

@ObjectType()
export class DeleteEntityPayload extends RelayMutationPayload {}
