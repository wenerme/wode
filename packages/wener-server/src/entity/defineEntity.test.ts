import 'reflect-metadata';
import { MetadataStorage } from '@mikro-orm/core';
import { Entity } from '@mikro-orm/decorators/legacy';
import { expect, test } from 'vitest';
import { defineEntity, getEntityDef } from './defineEntity';
import { StandardBaseEntity } from './StandardBaseEntity';

test('defineEntity', () => {
	defineEntity([{ Entity: UserEntity, idType: 'usr' }]);
	let metadata = MetadataStorage.getMetadataFromDecorator(UserEntity);
	// fixme no tableName why?
	console.log(metadata);
	expect(getEntityDef(UserEntity)).toBeTruthy();
	expect(getEntityDef(new UserEntity())).toBeTruthy();
	expect(getEntityDef('usr_123')).toBeTruthy();
});

@Entity({ schema: 'sys', tableName: 'users' })
class UserEntity extends StandardBaseEntity {}
