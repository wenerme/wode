import { CreationOptional, DataTypes, fn, InferAttributes, InferCreationAttributes, Model } from '@sequelize/core';

export const MinimalModelFields = {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    defaultValue: fn('gen_ulid'),
    // defaultValue: sequelize.literal('DEFAULT')
  },
  createdAt: {
    type: DataTypes.DATE,
  },
  updatedAt: {
    type: DataTypes.DATE,
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
} as const;

export const UUIDField = {
  type: DataTypes.UUID,
  allowNull: false,
  defaultValue: fn('gen_random_uuid'),
} as const;

export const TidField = { type: DataTypes.STRING, allowNull: false, defaultValue: fn('current_tenant_id') } as const;
export const UidField = {
  type: DataTypes.UUID,
  allowNull: false,
  defaultValue: fn('gen_random_uuid'),
} as const;

export const BaseTenantModelFields = {
  ...MinimalModelFields,
  uid: UidField,
  tid: TidField,
  eid: {
    type: DataTypes.STRING,
  },
} as const;

export const BaseModelFields = {
  ...MinimalModelFields,
  uid: UidField,
  sid: {
    type: DataTypes.BIGINT,
  },
  eid: {
    type: DataTypes.STRING,
  },
} as const;

export class BaseModel<T extends Model> extends Model<InferAttributes<T>, InferCreationAttributes<T>> {
  declare id: CreationOptional<string>;
  declare uid: CreationOptional<string>;
  declare sid: CreationOptional<number>;
  declare eid?: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt?: CreationOptional<Date>;
}
