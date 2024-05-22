import 'reflect-metadata';
import { Entity, MetadataStorage } from '@mikro-orm/core';
import { expect, test } from 'vitest';
import { defineEntity, getEntityDef } from './defineEntity';
import { StandardBaseEntity } from './StandardBaseEntity';

test('defineEntity', () => {
  defineEntity([{ Entity: UserEntity, idType: 'usr' }]);
  let metadata = MetadataStorage.getMetadataFromDecorator(UserEntity);
  console.log(metadata);
  expect(getEntityDef(UserEntity)).toBeTruthy();
  expect(getEntityDef('usr_123')).toBeTruthy();
});

@Entity({ schema: 'sys', tableName: 'users' })
class UserEntity extends StandardBaseEntity {}
