import { Arg, Field, FieldResolver, InterfaceType, ObjectType, Resolver, Root } from 'type-graphql';
import { Constructor } from '../types';
import { BaseNode } from './BaseNode';
import { RelayNode } from './relay';

export function withNotesObject<TBase extends Constructor>(Base: TBase) {
  @ObjectType()
  class HasNotesObject extends Base {
    @Field(() => String, { nullable: true })
    notes?: string;
  }

  return HasNotesObject;
}

export function withTagsObject<TBase extends Constructor>(Base: TBase) {
  @ObjectType()
  class HasTagsObject extends Base {
    @Field(() => [String], { defaultValue: [], nullable: true })
    tags: string[] = [];
  }

  return HasTagsObject;
}

@InterfaceType('HasTags', {
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasTagsNode.resolveType(...args);
  },
})
export class HasTagsNode extends BaseNode {
  @Field(() => [String], { defaultValue: [], nullable: true })
  tags: string[] = [];

  static resolveType = RelayNode.resolveType;
}

@Resolver(() => HasTagsNode)
export class HasTagsResolver {
  @FieldResolver(() => Boolean)
  hasTag(@Root() root: HasTagsNode, @Arg('tag') tag: string) {
    return Boolean(root.tags?.includes(tag));
  }
}
