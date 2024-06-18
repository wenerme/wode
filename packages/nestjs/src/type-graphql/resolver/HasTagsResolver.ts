import { Arg, FieldResolver, Resolver, Root } from 'type-graphql';
import { HasTagsNode } from '../interface/HasTagsNode';

@Resolver(() => HasTagsNode)
export class HasTagsResolver {
  @FieldResolver(() => Boolean)
  hasTag(@Root() root: HasTagsNode, @Arg('tag') tag: string) {
    return Boolean(root.tags?.includes(tag));
  }
}
