import { expect, test } from 'vite-plus/test';
import { mixin } from './mixin';

// import type { Constructor } from '#/types';
type Constructor<T = {}> = new (...args: any[]) => T;

test('mixin', () => {
	// @Ent()
	class User extends mixin(BaseResource, withFooFields) {
		a?: string;
	}
	// @Ent()
	class User2 extends mixin(BaseEnt, withFooFields) {
		x: string = 'x';
	}

	// type works
	const usr = new User();
	expect(usr.foo, 'foo');

	const u2 = new User2();
	console.log(u2);
});

//  <T extends EntityClass<unknown>>(options?: EntityOptions<T>): (target: T) => void;

// @Ent()
class BaseResource {
	id?: string = '';
}

// @Ent()
class BaseEnt extends BaseResource {
	base: string = 'base';
}

test('mixin deep not working', () => {
	// @ts-expect-error
	class User extends mixin(BaseResource, createBarFields()) {}

	let usr = new User();
	// type not working
	// @ts-expect-error
	expect(usr.foo, 'foo');
	expect(usr).toEqual({ foo: 'foo', bar: 'bar', id: '' });
});

function createBarFields() {
	return <TBase extends Constructor>(Base: TBase) => {
		// nested type not working
		// @ts-expect-error
		class HasBarMixin extends mixin(Base, withFooFields) {
			bar?: string = 'bar';
		}

		return HasBarMixin;
	};
}

function withFooFields<TBase extends Constructor>(Base: TBase) {
	class HasFieldFooMixin extends Base {
		foo?: string = 'foo';
	}

	return HasFieldFooMixin;
}
