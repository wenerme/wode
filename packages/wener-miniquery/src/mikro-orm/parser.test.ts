import {
  BaseEntity,
  Collection,
  Entity,
  ManyToMany,
  MikroORM,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  types,
} from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/sqlite';
import { expect, test } from 'vitest';
import { toMikroOrmQuery } from './toMikroOrmQuery';

async function getOrm() {
  const orm = await MikroORM.init(
    defineConfig({
      entities: [UserProfileEntity, UserEntity, GroupEntity, GroupMemberEntity],
      discovery: {
        disableDynamicFileAccess: true,
        requireEntitiesArray: true,
      },
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
      // debug: true,
    }),
  );
  let em = orm.em.fork();
  {
    for (const schema of [
      `
        create table users
        (
          id    bigint primary key,
          a     bigint,
          b     text,
          attrs json
        );
      `,
      `
        create table user_profile
        (
          id      bigint primary key,
          user_id bigint,
          age     bigint,
          attrs   json
        );
      `,
    ]) {
      await em.execute(schema);
    }
  }

  return { orm, em };
}

test('orm', async () => {
  const { em } = await getOrm();

  const repo = em.getRepository(UserEntity);

  // works
  await repo.findAll({ where: { attrs: { test: { $eq: true } } } });
  // not work
  await repo
    .qb()
    .where({ attrs: { test: { $eq: true } } })
    .getResult();
  // .getResultAndCount();
});

test('miniquery', async () => {
  const { em } = await getOrm();

  const repo = em.getRepository(UserEntity);

  // https://github.com/wenerme/wode/blob/main/packages/ohm-grammar-miniquery/src/miniquery.test.ts
  // https://github.com/wenerme/go-miniquery/blob/main/miniquery/parser_test.go
  const valid = [
    'a=0',
    'a>0',
    'a>1',
    '!a>1',
    ' a > 1 ',
    'a > 1 and b > "1" AND a > 1 or a > 1 OR a>1',
    'a > 1 && b > "1" and a > 1 || a > 1 || a>1',
    //
    'a is null AND a is not null',
    //
    'profile.age > 1',
    'profile.age between 18 and 28',
    'b between "a" and "z"',
    // json works as expected
    'attrs.test = true',
    'attrs.vendor.code = "wener"',
  ];

  for (const v of valid) {
    let query = toMikroOrmQuery(v, { em, Entity: UserEntity });
    try {
      const builder = repo.qb().where(query);
      console.log(`Query: ${v} \n\t ${builder.getQuery()}`);
      await builder.getResultAndCount();
    } catch (e) {
      console.log(`Query:`, query);
      throw e;
    }
  }
});

test('syntax', () => {
  for (const [a, b] of [
    // pg array
    ['tags @> ["1","2"]', { tags: { $contains: ['1', '2'] } }],
    ['tags @> [1,2,3]', { tags: { $contains: [1, 2, 3] } }],
    ['tags && [1,2,3]', { tags: { $overlap: [1, 2, 3] } }],
    ['tags <@ ["1"]', { tags: { $contained: ['1'] } }],
    ['!(tags @> ["1"])', { $not: { tags: { $contains: ['1'] } } }],
    // mikroorm collection $some, $every, $none
    // some(authors, title = 'a')
  ] as Array<[string, any]>) {
    expect(toMikroOrmQuery(a), `Query: ${a}`).toStrictEqual(b);
  }
});

@Entity({ tableName: 'users' })
class UserEntity extends BaseEntity {
  @PrimaryKey({ type: types.bigint })
  id!: number;

  @Property({ type: types.bigint, nullable: true })
  a?: number;
  @Property({ type: types.string, nullable: true })
  b?: string;

  @Property({ type: types.array, nullable: true })
  tags?: string[];

  @Property({ type: types.json, nullable: true })
  attrs?: Record<string, any>;

  @OneToOne(() => UserProfileEntity, 'user', { deleteRule: 'cascade' })
  profile?: UserProfileEntity;

  @ManyToMany(() => GroupEntity)
  groups = new Collection<GroupEntity>(this);
}

@Entity({ tableName: 'user_profile' })
class UserProfileEntity extends BaseEntity {
  @PrimaryKey({ type: types.bigint })
  id!: number;
  @Property({ type: types.bigint, nullable: true })
  age?: number;

  @Property({ type: types.bigint, nullable: false, persist: false })
  get userId() {
    return this.user?.id;
  }

  @OneToOne(() => UserEntity)
  user!: UserEntity;
}

@Entity({ tableName: 'groups' })
class GroupEntity extends BaseEntity {
  @PrimaryKey({ type: types.bigint })
  id!: number;

  @Property({ type: types.string, nullable: true })
  name?: string;

  @Property({ type: types.json, nullable: true })
  attrs?: Record<string, any>;
}

@Entity({ tableName: 'group_member' })
class GroupMemberEntity extends BaseEntity {
  @PrimaryKey({ type: types.bigint })
  id!: number;

  @Property({ type: types.bigint, nullable: false })
  userId?: number;

  @Property({ type: types.bigint, nullable: false })
  groupId?: number;
}
