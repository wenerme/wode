import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export class BaseObject {
  @Field((type) => ID)
  id!: string;

  @Field(() => String)
  uid!: string;

  @Field(() => String, { nullable: true })
  eid?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  // @Field()
  // attributes!: Record<string, any>;
  //
  // @Field()
  // properties!: Record<string, any>;

  // @Field()
  // extensions!: Record<string, any>;
}
