import { BaseNode, BaseObject, RelayNode } from '@wener/nestjs/type-graphql';
import { ObjectType } from 'type-graphql';

@ObjectType({ implements: [RelayNode, BaseNode] })
export class TenantBaseObject extends BaseObject {
  // 不需要这个字段
  // @Field(() => String)
  // tid!: string;
}
