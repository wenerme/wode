import { Field, InputType } from 'type-graphql';

@InputType()
export class OnConflictInput {
  @Field(() => [String], { nullable: true })
  fields?: string[];

  @Field(() => String, { nullable: true })
  action?: string;

  @Field(() => [String], { nullable: true })
  merge?: string[];

  @Field(() => [String], { nullable: true })
  exclude?: string[];
}
