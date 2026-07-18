import 'reflect-metadata';
import { BaseEntity, defineEntity as defineMikroEntity, p } from '@mikro-orm/core';
import { expect, test } from 'vite-plus/test';
import { setEntitySchemaClass } from './defineEntitySchemaClass';
import { StandardBaseEntity } from './StandardBaseEntity';

test('defineEntity inheritance keeps BaseEntity runtime methods with helper compatibility', () => {
	const BrokenSchema = defineMikroEntity({
		name: 'BrokenChildEntity',
		extends: StandardBaseEntity,
		properties: { name: p.string() },
	});
	class BrokenChildEntity extends BrokenSchema.class {}
	BrokenSchema.setClass(BrokenChildEntity);

	const broken = new BrokenChildEntity();
	expect(broken instanceof StandardBaseEntity).toBe(true);
	expect(broken instanceof BaseEntity).toBe(true);
	expect(typeof broken.assign).toBe('function');

	const ChildSchema = defineMikroEntity({
		name: 'ChildEntity',
		extends: StandardBaseEntity,
		properties: { name: p.string() },
	});
	class ChildEntity extends ChildSchema.class {}
	setEntitySchemaClass(ChildSchema, ChildEntity, StandardBaseEntity);

	const child = new ChildEntity();
	expect(child instanceof StandardBaseEntity).toBe(true);
	expect(child instanceof BaseEntity).toBe(true);
	expect(typeof child.assign).toBe('function');
	expect(ChildSchema.meta.extends).toBe(StandardBaseEntity);
});
