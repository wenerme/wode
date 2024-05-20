import { Injectable } from '@nestjs/common';
import { Args, Field, FieldResolver, ObjectType, Resolver, Root } from 'type-graphql';
import { GraphQLJSONScalar } from './GraphQLJSONScalar';
import { JSONArgs } from './JSONArgs';
import { RelayMutationPayload } from './relay';
import { resolveGraphQLJSON } from './resolveGraphQLJSON';

@ObjectType('GeneralResponse')
export class GeneralResponseObject extends RelayMutationPayload {
  @Field(() => String, { nullable: false, defaultValue: 'OK' })
  message?: string = 'OK';

  @Field(() => GraphQLJSONScalar, { nullable: true })
  data?: any;
}

@Resolver(() => GeneralResponseObject)
@Injectable()
export class GeneralResponseResolver {
  @FieldResolver(() => GraphQLJSONScalar, { nullable: true })
  data(@Root() root: GeneralResponseObject, @Args(() => JSONArgs) args: JSONArgs) {
    return resolveGraphQLJSON(root.data, args);
  }
}
