import { Field, ObjectType, Query } from '@nestjs/graphql';

@ObjectType()
export class CurrentContext {
  @Field({
    description: 'current server time',
  })
  now!: Date;
}

export class RootResolver {
  @Query(() => CurrentContext)
  current() {
    return {
      now: new Date(),
    };
  }
}
