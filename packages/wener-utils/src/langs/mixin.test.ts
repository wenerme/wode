import { expect, test } from 'vitest';
import { mixin } from './mixin';

export type Constructor<T = {}> = new (...args: any[]) => T;

test('mixin', () => {
  // @ts-ignore
  class User extends mixin(BaseResource, createBarFields()) {}

  let usr = new User();
  // type not working
  // @ts-ignore
  expect(usr.foo, 'foo');
  expect(usr).toEqual({
    foo: 'foo',
    bar: 'bar',
    id: '',
  });
});

class BaseResource {
  id?: string = '';
}

function createBarFields() {
  return <TBase extends Constructor>(Base: TBase) => {
    // nested type not working
    // @ts-ignore
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
