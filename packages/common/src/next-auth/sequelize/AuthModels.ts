import type { CreationOptional, InferAttributes, InferCreationAttributes } from '@sequelize/core';
import { DataTypes, fn, Model } from '@sequelize/core';
import type { InitOptions } from '@sequelize/core/types/model';

export class VerificationToken extends Model<
  InferAttributes<VerificationToken>,
  InferCreationAttributes<VerificationToken>
> {
  declare id: CreationOptional<string>;
  declare updatedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare token: string;
  declare identifier: string;
  declare expires: Date;
}

export class Session extends Model<InferAttributes<Session>, InferCreationAttributes<Session>> {
  declare id: CreationOptional<string>;
  declare updatedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;

  declare expires: Date;
  declare sessionToken: string;
  declare userId: string;
  declare userAgent?: string;
  declare lastUserAgent?: string;
}

export class Account extends Model<InferAttributes<Account>, InferCreationAttributes<Account>> {
  declare id: CreationOptional<string>;
  declare updatedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;

  declare type: string;
  declare provider: string;
  declare providerAccountId: string;
  declare refresh_token: string;
  declare access_token: string;
  declare expires_at: string;
  declare token_type: string;
  declare scope: string;
  declare id_token: string;
  declare session_state: string;
  declare userId: string;
  //
  declare unionid?: string;
  declare raw: Record<string, any>;
}

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare updatedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;

  declare name: string;
  declare email: string;
  declare emailVerified?: Date | null;
  declare phoneNumber?: string;
  declare raw?: Record<string, any>;
}

export function initAuthModels(defaultModelOptions: InitOptions<any>) {
  User.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: fn('gen_ulid'),
      },
      name: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING, unique: true },
      emailVerified: { type: DataTypes.DATE },
      image: { type: DataTypes.STRING },
      // extra
      phoneNumber: { type: DataTypes.STRING, unique: true },
      raw: { type: DataTypes.JSONB },
      //
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      ...defaultModelOptions,
      tableName: 'users',
    },
  );
  Session.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: fn('gen_ulid'),
      },
      expires: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
      sessionToken: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      userId: { type: DataTypes.UUID },

      // extra
      userAgent: { type: DataTypes.STRING },
      lastUserAgent: { type: DataTypes.STRING },

      //
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      ...defaultModelOptions,
      tableName: 'sessions',
    },
  );
  Account.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: fn('gen_ulid'),
      },
      type: { type: DataTypes.STRING, allowNull: false },
      provider: { type: DataTypes.STRING, allowNull: false },
      providerAccountId: { type: DataTypes.STRING, allowNull: false },
      refresh_token: { type: DataTypes.STRING },
      access_token: { type: DataTypes.STRING },
      expires_at: { type: DataTypes.DATE },
      token_type: { type: DataTypes.STRING },
      scope: { type: DataTypes.STRING },
      id_token: { type: DataTypes.STRING },
      session_state: { type: DataTypes.STRING },
      userId: { type: DataTypes.UUID },
      // extra
      unionid: { type: DataTypes.STRING, field: 'union_id' },
      raw: { type: DataTypes.JSONB },

      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      ...defaultModelOptions,
      tableName: 'accounts',
    },
  );

  VerificationToken.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: fn('gen_ulid'),
      },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE },

      token: { type: DataTypes.STRING, unique: true },
      identifier: { type: DataTypes.STRING, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    },
    { ...defaultModelOptions, tableName: 'verification_tokens' },
  );

  Provider.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: fn('gen_ulid'),
      },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE },

      providerType: { type: DataTypes.STRING },
      providerId: { type: DataTypes.STRING },
      displayName: { type: DataTypes.STRING },
      clientId: { type: DataTypes.STRING },
      clientSecret: { type: DataTypes.STRING },
      clientConfig: { type: DataTypes.JSONB },
      enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      ...defaultModelOptions,
    },
  );

  Account.belongsTo(User, {});
  Session.belongsTo(User, {});
}

export class Provider extends Model<InferAttributes<Provider>, InferCreationAttributes<Provider>> {
  declare id: CreationOptional<string>;
  declare updatedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;

  declare providerType: string;
  declare providerId: string;
  declare displayName?: string;
  declare clientId: string;
  declare clientSecret: string;
  declare clientConfig?: Record<string, any>;
  declare enabled: CreationOptional<boolean>;
}

export const AuthModels = {
  User,
  Session,
  Account,
  Provider,
} as const;
