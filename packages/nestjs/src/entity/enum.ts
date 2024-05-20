export enum EntityFeature {
  HasAuditor = 'HasAuditor',
  HasOwner = 'HasOwner',
  HasStatus = 'HasStatus',
  HasCustomer = 'HasCustomer',
  HasLabels = 'HasLabels',
  HasSid = 'HasSid',
  HasActivity = 'HasActivity',
  HasTags = 'HasTags',
  HasNotes = 'HasNotes',
  HasCode = 'HasCode',
  HasVendorRef = 'HasVendorRef',
  HasEntityRef = 'HasEntityRef',
  IsCustomer = 'IsCustomer',
  IsActivity = 'IsActivity',
  IsOwner = 'IsOwner',
  IsState = 'IsState',
  IsStatus = 'IsStatus',
  IsSystemType = 'IsSystemType',
  IsTenantType = 'IsTenantType',
}

export type EntityFeatureCode = keyof typeof EntityFeature;
