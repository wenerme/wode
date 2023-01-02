import type { CreationOptional, InferAttributes, InferCreationAttributes, InitOptions } from '@sequelize/core';
import { DataTypes, Model } from '@sequelize/core';
import { Attribute, PrimaryKey, Table } from '@sequelize/core/decorators-legacy';

@Table({})
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @Attribute(DataTypes.STRING)
  @PrimaryKey()
  declare id: CreationOptional<string>;

  @Attribute(DataTypes.STRING)
  declare uid: CreationOptional<string>;

  @Attribute(DataTypes.BIGINT)
  declare sid: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  declare eid?: CreationOptional<string>;

  @Attribute(DataTypes.TIME)
  declare createdAt: CreationOptional<Date>;

  @Attribute(DataTypes.TIME)
  declare updatedAt: CreationOptional<Date>;

  @Attribute(DataTypes.TIME)
  declare deletedAt?: CreationOptional<Date>;
}

export function initModels({ sequelize, ...init }: InitOptions<any>) {
  const options = {
    underscored: true,
    paranoid: true,
    sequelize,
    ...init,
  };
  sequelize.addModels([User]);
}
