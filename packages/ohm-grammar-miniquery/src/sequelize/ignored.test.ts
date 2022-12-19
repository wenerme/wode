import test from 'ava';
import { DataTypes, Sequelize } from '@sequelize/core';

let sequelize: Sequelize;
test.before(async (t) => {
  sequelize = new Sequelize('sqlite::memory:');
  const User = await sequelize.define(
    'User',
    {
      username: {
        type: DataTypes.STRING,
      },
      name: {
        type: DataTypes.STRING,
      },
      age: {
        type: DataTypes.INTEGER,
      },
      attributes: {
        type: DataTypes.JSON,
      },
      profileId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Profile',
          key: 'id',
        },
      },
      avatarUrl: {
        type: DataTypes.STRING,
      },
    },
    {
      underscored: true,
    },
  );
  const Profile = await sequelize.define(
    'Profile',
    {
      name: {
        type: DataTypes.STRING,
      },
      attributes: {
        type: DataTypes.JSON,
      },
    },
    {
      underscored: true,
    },
  );

  User.hasOne(Profile, {
    as: 'profile',
  });
  Profile.belongsTo(User, {
    as: 'user',
  });
});

test('sequelize type', async (t) => {
  const { Model, ...attrs } = sequelize.models.User.getAttributes().attributes as any;
  t.log(attrs);
  t.log(attrs.type in DataTypes.JSON);
  t.log(attrs.type.key === DataTypes.JSON.key);
  t.pass();
});
