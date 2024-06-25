import { Features } from '../../Feature';
import { EntityFeature } from '../enum';
import {
  HasAuditorRefEntity,
  HasCustomerRefEntity,
  HasEntityRefEntity,
  HasOwnerRefEntity,
  HasStateStatusEntity,
  HasTagsEntity,
  HasVendorRefEntity,
} from '../mixins';

type FeatureTypes = {
  [EntityFeature.HasEntityRef]: HasEntityRefEntity;
  [EntityFeature.HasStateStatus]: HasStateStatusEntity;
  [EntityFeature.HasVendorRef]: HasVendorRefEntity;
  [EntityFeature.HasTags]: HasTagsEntity;
  [EntityFeature.HasAuditorRef]: HasAuditorRefEntity;
  [EntityFeature.HasOwnerRef]: HasOwnerRefEntity;
  [EntityFeature.HasCustomer]: HasCustomerRefEntity;
};

export function hasEntityFeature<E, F extends keyof FeatureTypes>(
  entity: E, // maybe constructor
  feature: F,
): entity is E & FeatureTypes[F] {
  return Features.hasFeature(entity, feature);
}
