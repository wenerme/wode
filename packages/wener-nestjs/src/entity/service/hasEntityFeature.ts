import { Features } from '../../Feature';
import { EntityFeature } from '../enum';
import type {
  HasAuditorRefEntity,
  HasCodeEntity,
  HasCustomerRefEntity,
  HasDisplayOrderEntity,
  HasEntityRefEntity,
  HasMetadataEntity,
  HasNotesEntity,
  HasOwnerRefEntity,
  HasSlugEntity,
  HasStateStatusEntity,
  HasTagsEntity,
  HasVendorRefEntity,
} from '../mixins';

type FeatureTypes = {
  [EntityFeature.HasAuditorRef]: HasAuditorRefEntity;
  [EntityFeature.HasCode]: HasCodeEntity;
  [EntityFeature.HasCustomer]: HasCustomerRefEntity;
  [EntityFeature.HasDisplayOrder]: HasDisplayOrderEntity;
  [EntityFeature.HasEntityRef]: HasEntityRefEntity;
  [EntityFeature.HasMetadata]: HasMetadataEntity;
  [EntityFeature.HasNotes]: HasNotesEntity;
  [EntityFeature.HasOwnerRef]: HasOwnerRefEntity;
  [EntityFeature.HasSlug]: HasSlugEntity;
  [EntityFeature.HasStateStatus]: HasStateStatusEntity;
  [EntityFeature.HasTags]: HasTagsEntity;
  [EntityFeature.HasVendorRef]: HasVendorRefEntity;
};

export function hasEntityFeature<E, F extends keyof FeatureTypes>(
  entity: E, // maybe constructor
  feature: F,
): entity is E & FeatureTypes[F] {
  return Features.hasFeature(entity, feature);
}
