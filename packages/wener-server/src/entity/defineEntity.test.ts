import 'reflect-metadata';
import { defineEntity as defineMikroEntity } from '@mikro-orm/core';
import { expect, test } from 'vite-plus/test';
import { defineEntity, getEntityDef } from './defineEntity';
import { setEntitySchemaClass } from './defineEntitySchemaClass';
import { StandardBaseEntity } from './StandardBaseEntity';

test('defineEntity', () => {
	defineEntity([{ Entity: UserEntity, EntitySchema: UserEntitySchema, idType: 'usr' }]);
	expect(getEntityDef(UserEntity)?.tableName).toBe('users');
	expect(getEntityDef(new UserEntity())).toBeTruthy();
	expect(getEntityDef('usr_01K856BPKM2RKHGQP7VWRFPQ57')).toBeTruthy();
});

const UserEntitySchema = defineMikroEntity({
	name: 'UserEntity',
	schema: 'sys',
	tableName: 'users',
	extends: StandardBaseEntity,
	properties: {},
});
class UserEntity extends UserEntitySchema.class {}
setEntitySchemaClass(UserEntitySchema, UserEntity, StandardBaseEntity);
