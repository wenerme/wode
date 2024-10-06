export enum OwnerType {
  User = 'User',
  Team = 'Team',
}

// 性别
export enum SexType {
  // 男性
  Male = 'Male',
  // 女性
  Female = 'Female',
  // 间性
  // Intersex = 'Intersex'
  // 未知
  Unknown = 'Unknown',
}

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

/*
export enum GenderType {
  Male = 'Male',           // 男性
  Female = 'Female',       // 女性
  NonBinary = 'NonBinary', // 非二元，不完全认同男性或女性
  Transgender = 'Transgender', // 跨性别，性别认同与出生时分配的性别不符
  Genderqueer = 'Genderqueer', // 性别酷儿，不遵循传统性别二分法的性别认同
  Agender = 'Agender',     // 无性别，不认同任何性别
  Other = 'Other',         // 其他，可能是自定义的性别认同
  PreferNotToSay = 'PreferNotToSay' // 选择不透露
}
 */
