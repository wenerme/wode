import type { EntitySchema } from '@mikro-orm/core';

/**
 * Attach a concrete entity class to a defineEntity schema.
 *
 * Older MikroORM v7 `defineEntity({ extends })` builds tracked metadata inheritance, but
 * the generated intermediate schema class did not always inherit the runtime prototype of
 * the base class. Newer MikroORM versions already bridge this; this helper keeps the
 * compatibility fix idempotent for both behaviours.
 */
export function setEntitySchemaClass<T extends EntitySchema<any>, C extends abstract new (...args: any[]) => any>(
	schema: T,
	Entity: C,
	Base?: Function,
) {
	if (Base && !(schema.class.prototype instanceof Base)) {
		Object.setPrototypeOf(schema.class.prototype, Base.prototype);
	}
	schema.setClass(Entity);
	return Entity;
}
