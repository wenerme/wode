import { Field, InterfaceType } from 'type-graphql';
import { BaseNode } from '../BaseNode';
import { RelayNode } from '../relay';
import { HasEntityRefNode } from './HasEntityRefNode';

/**
 * Anything that expose to direct url based access should have a slug
 */
@InterfaceType({
  implements: [BaseNode],
  autoRegisterImplementations: false,
  resolveType: (...args) => {
    return HasEntityRefNode.resolveType(...args);
  },
})
export class HasSlugNode extends BaseNode {
  @Field(() => String, { nullable: true })
  slug?: string;

  static resolveType = RelayNode.resolveType;
}
