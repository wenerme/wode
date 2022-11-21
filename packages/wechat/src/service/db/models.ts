import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  InitOptions} from '@sequelize/core';
import {
  DataTypes,
  fn,
  Model,
} from '@sequelize/core';

const BaseFields = {
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

export class WechatToken extends Model<InferAttributes<WechatToken>, InferCreationAttributes<WechatToken>> {
  declare id: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt?: CreationOptional<Date>;

  declare appId: string;
  declare token: string;
  declare type: string;
  declare expiresAt?: CreationOptional<Date>;
  declare expiresIn?: CreationOptional<number>;
}

export function initModels(init: InitOptions) {
  const options = {
    underscored: true,
    paranoid: true,
    ...init,
  };
  WechatToken.init(
    {
      ...BaseFields,
      appId: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      token: { type: DataTypes.STRING, allowNull: false },
      expiresIn: { type: DataTypes.BIGINT, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      ...options,
      tableName: 'wechat_tokens',
      indexes: [{ fields: ['appId', 'type'], unique: true }],
    },
  );
}
