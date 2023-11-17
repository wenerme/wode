import type { FindOptions, Includeable, ModelStatic, WhereOptions } from '@sequelize/core';
import { DataTypes, Sequelize } from '@sequelize/core';
import { beforeAll, expect, test, TestContext } from 'vitest';
import { toMiniQueryAST } from '../ast';
import { toSequelizeWhere } from './where';

let sequelize: Sequelize;
beforeAll(async () => {
  sequelize = new Sequelize('sqlite::memory:');
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
          model: Profile,
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
  const Department = await sequelize.define(
    'Department',
    {
      fullName: {
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

  const Pet = await sequelize.define(
    'Pet',
    {
      fullName: {
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

  const Image = await sequelize.define(
    'Image',
    {
      imageUrl: {
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
  Department.hasMany(User, {
    as: 'users',
  });
  User.belongsTo(Department, {
    as: 'department',
  });

  User.hasMany(Pet, {
    as: 'pets',
  });
  Pet.belongsTo(User, {
    as: 'user',
  });

  User.hasOne(Profile, {
    as: 'profile',
  });
  Profile.belongsTo(User, {
    as: 'user',
  });

  Profile.hasOne(Image, {
    as: 'avatar',
  });
  Image.belongsTo(Profile);

  await sequelize.sync();
});
// fixme 无法处理关联
test('sequelize where', async (t) => {
  const { User } = sequelize.models;
  for (const s of [
    '',
    `age > -1`,
    `User.age > -1`,
    // `length(profile.name) > 1`,
    `length(name) > length(username)`,
    `name = 'wener' and age > 18 and age < 80`,
    `name = 'wener' and (age > 18 or age < 80)`,
    `age not between 18 and 80`,
    `date(createdAt) between '2020-01-01' and '2020-01-31' and length(name) > 1 and username is not null and name like 'wen%'`,
    // `attributes.user.name = 'wener'`, // json
    // `attributes.'user name' = 'wener'`, // json
    // `attributes.'user.name' = 'wener'`, // 无法正确 escape
    `age > 0 and age > 0 and age > 0`, // should flatten
    `avatarUrl is not null`, // handle case
  ]) {
    await assertQuery(t, User, s);
  }
});

test('sequelize association', async (t) => {
  const { User } = sequelize.models;
  for (const s of [`profile.name is not null`, `profile.avatar.imageUrl is not null`]) {
    await assertQuery(t, User, s);
  }
});

async function assertQuery(t: TestContext, Model: ModelStatic<any>, query: string) {
  let where: WhereOptions;
  let include: Includeable[];
  try {
    ({ where, include } = toSequelizeWhere(query, {
      sequelize,
      Model,
    }));
  } catch (e) {
    console.log(`MiniQuery: ${query}`);
    console.log(`AST`, toMiniQueryAST(query));
    throw e;
  }

  let sql = '';
  try {
    await Model.findAll({
      logging: (s) => {
        const indexOf = s.indexOf('WHERE ');
        if (indexOf < 0) {
          return (sql = '');
        }
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        return (sql = s.substring(indexOf + 'WHERE '.length, s.length - 1));
      },
      where,
      include,
    });
  } catch (e: any) {
    console.error('ERROR', e?.message);
    console.log(`SQL: ${sql}`);
    console.log(`MiniQuery: ${query}`);
    console.log(`Where`, where);
    throw e;
  }
  expect(sql, `Query: ${query}`).matchSnapshot();
}

test('sequelize incorrect', async (t) => {
  const { User } = sequelize.models;
  for (const s of [
    '1 > 0',
    `name.not_ok = ''`,
    `not_exists = ''`,
    `avatar_url is not null`, // attr not found
    `pets.fullName is not null`, // use has instead
    `pets.fullName: 'wener'`, // not supported yet
  ]) {
    let opt: FindOptions = {};

    expect(() => {
      opt = toSequelizeWhere(s, {
        sequelize,
        Model: User,
      });
      console.log(`Where`, opt.where);
    }, `Query: ${s}`).throw();
    await User.findAll({
      ...opt,
    });
  }
});

test('sequelize type', async (t) => {
  const { type } = sequelize.models.User.getAttributes().attributes as any;
  expect(type).toBeInstanceOf(DataTypes.JSON);
  // sqlite do not support json
  expect(String(type)).toBe('TEXT');
});
