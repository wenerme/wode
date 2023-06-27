import { test } from 'vitest';
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
import { parse } from './miniquery';

test('miniquery', async () => {
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
              id    bigint primary key,
              user_id   bigint,
              age   bigint,
              attrs json
          );
      `,
    ]) {
      await em.execute(schema);
    }
  }

  const repo = em.getRepository(UserEntity);

  // https://github.com/wenerme/wode/blob/main/packages/ohm-grammar-miniquery/src/miniquery.test.ts
  // https://github.com/wenerme/go-miniquery/blob/main/miniquery/parser_test.go
  const valid = [
    'a>1',
    '!a>1',
    ' a > 1 ',
    'a > 1 and b > "1" AND a > 1 or a > 1 OR a>1',
    //
    'a is null AND a is not null',
    //
    'profile.age > 1',
    // json works as expected
    'attrs.test = true',
  ];

  for (const v of valid) {
    const builder = repo.qb().where(parse(v));
    console.log(`Query: ${v} \n\t ${builder.getQuery()}`);
    await builder.getResultAndCount();
  }
});

@Entity({ tableName: 'users' })
class UserEntity extends BaseEntity<UserEntity, 'id'> {
  @PrimaryKey({ type: types.bigint })
  id!: number;

  @Property({ type: types.bigint, nullable: true })
  a?: number;
  @Property({ type: types.string, nullable: true })
  b?: string;

  @Property({ type: types.json, nullable: true })
  attrs?: Record<string, any>;

  @OneToOne(() => UserProfileEntity, 'user', { onDelete: 'cascade' })
  profile?: UserProfileEntity;

  @ManyToMany(() => GroupEntity)
  groups = new Collection<GroupEntity>(this);
}

@Entity({ tableName: 'user_profile' })
class UserProfileEntity extends BaseEntity<GroupEntity, 'id'> {
  @PrimaryKey({ type: types.bigint })
  id!: number;
  @Property({ type: types.bigint, nullable: true })
  age?: number;

  @Property({ type: types.bigint, nullable: false })
  userId!: number;

  @OneToOne(() => UserEntity)
  user!: UserEntity;
}

@Entity({ tableName: 'groups' })
class GroupEntity extends BaseEntity<GroupEntity, 'id'> {
  @PrimaryKey({ type: types.bigint })
  id!: number;

  @Property({ type: types.string, nullable: true })
  name?: string;

  @Property({ type: types.json, nullable: true })
  attrs?: Record<string, any>;
}

@Entity({ tableName: 'group_member' })
class GroupMemberEntity extends BaseEntity<GroupMemberEntity, 'id'> {
  @PrimaryKey({ type: types.bigint })
  id!: number;

  @Property({ type: types.bigint, nullable: false })
  userId?: number;

  @Property({ type: types.bigint, nullable: false })
  groupId?: number;
}
