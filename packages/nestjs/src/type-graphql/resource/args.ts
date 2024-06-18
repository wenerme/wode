import { ArgsType, Field, ID } from 'type-graphql';

@ArgsType()
export class ResolveResourceArgs {
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

@ArgsType()
export class GetResourceArgs {
  @Field(() => ID, { nullable: true })
  id!: string;
}

@ArgsType()
export class DeleteResourceArgs {
  @Field(() => ID, { nullable: true })
  id!: string;
}
