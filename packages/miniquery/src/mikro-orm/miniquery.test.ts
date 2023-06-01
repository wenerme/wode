import { test } from 'vitest';
import { BaseEntity, Entity, MikroORM, PrimaryKey, Property, ReflectMetadataProvider, types } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/sqlite';
import { parse } from './miniquery';

test('miniquery', async () => {
  const orm = await MikroORM.init(
    defineConfig({
      entities: [UserEntity],
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
  await em.execute(`
      create table users
      (
          id bigint primary key,
          a  bigint,
          b  text
      );
  `);
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
}
