import { Args, FieldResolver, Resolver, Root } from 'type-graphql';
import { GraphQLJSONScalar } from '../GraphQLJSONScalar';
import { HasMetadataNode } from '../interface';
import { JSONArgs } from '../JSONArgs';
import { resolveGraphQLJSON } from '../resolveGraphQLJSON';

@Resolver(() => HasMetadataNode)
export class HasMetadataResolver {
  @FieldResolver(() => GraphQLJSONScalar, { nullable: true })
  resolveMetadata(@Root() root: HasMetadataNode, @Args(() => JSONArgs) args: JSONArgs) {
    return resolveGraphQLJSON(root.metadata, args);
  }
}
