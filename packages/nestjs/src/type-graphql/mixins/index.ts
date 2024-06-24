import { Constructor } from '@wener/utils';
import { Field, ID, InputType, InterfaceType, ObjectType } from 'type-graphql';
import {
  HasAuditorRefNode,
  HasCustomerRefNode,
  HasOwnerRefNode,
  HasStateStatusNode,
  HasVendorRefNode,
} from '../interface';
import { HasTitleDescriptionNode } from '../interface/HasTitleDescriptionNode';

export { withMetadataType } from './withMetadataType';
export { withNotesType } from './withNotesType';
export { withTagsType } from './withTagsType';
export { createDataType } from './createDataType';
export { withDisplayOrderType } from './withDisplayOrderType';
export { withCodeType } from './withCodeType';

export function withTitleDescriptionType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasTitleDescriptionNode })
  @ObjectType({ implements: HasTitleDescriptionNode })
  @InputType()
  class HasTitleDescriptionMixinType extends Base {
    @Field(() => String, { nullable: false })
    title!: string;

    @Field(() => String, { nullable: true })
    description?: string;
  }

  return HasTitleDescriptionMixinType;
}

export function withVendorRefType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasVendorRefNode })
  @ObjectType({ implements: HasVendorRefNode })
  @InputType()
  class HasVendorRefMixinType extends Base {
    @Field(() => String, { nullable: true })
    cid?: string;

    @Field(() => String, { nullable: true })
    rid?: string;
  }

  return HasVendorRefMixinType;
}

export function withOwnerRefType<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasOwnerRefNode })
  @ObjectType({ implements: HasOwnerRefNode })
  @InputType()
  class HasVendorRefMixinType extends Base {
    @Field(() => ID, { nullable: true })
    ownerId?: string;
    @Field(() => String, { nullable: true })
    ownerType?: string;
    @Field(() => ID, { nullable: true })
    ownerUserId?: string;
  }

  return HasVendorRefMixinType;
}

export function withAuditorRefObject<TBase extends Constructor>(Base: TBase) {
  @InterfaceType({ implements: HasAuditorRefNode })
  @ObjectType({ implements: HasAuditorRefNode })
  @InputType()
  class HasAuditorRefMixinType extends Base {
    @Field(() => ID, { nullable: true })
    createdById?: string;
    @Field(() => ID, { nullable: true })
    updatedById?: string;
    @Field(() => ID, { nullable: true })
    deletedById?: string;
  }

  return HasAuditorRefMixinType;
}

export function withCustomerRefType<TBase extends Constructor>(Base: TBase) {
  @ObjectType({ implements: [HasCustomerRefNode] })
  @InterfaceType({ implements: [HasCustomerRefNode] })
  @InputType()
  class HasCustomerRefMixinType extends Base {
    @Field(() => String, { nullable: true })
    customerId?: string;
    @Field(() => String, { nullable: true })
    customerType?: string;
    @Field(() => String, { nullable: true })
    contactId?: string;
    @Field(() => String, { nullable: true })
    accountId?: string;
  }

  return HasCustomerRefMixinType;
}

export function withStateStatusType<TBase extends Constructor>(Base: TBase) {
  @ObjectType({ implements: [HasStateStatusNode] })
  @InterfaceType({ implements: [HasStateStatusNode] })
  @InputType()
  class HasStateStatusMixinType extends Base {
    @Field(() => String, { nullable: false })
    state!: string;
    @Field(() => String, { nullable: false })
    status!: string;
  }

  return HasStateStatusMixinType;
}
