import assert from 'node:assert/strict';
import { produce } from 'immer';
import { create, markSimpleObject } from 'mutative';
import { test, expect } from 'vitest';
import { createStore } from 'zustand';
import { mutative as immer } from './zustand.mutative';

test('mutative', () => {
  const o: Record<string, any> = {
    a: { v: 0 },
    b: { v: 0 },
    c: { v: 0 },
  };

  // by produce
  {
    const o2 = produce(o, (s) => {
      s.b.v = 1;
    });

    assert.equal(o2.b.v, 1);
    // 没变
    assert(o.a === o2.a);
    assert(o.b !== o2.b);
  }
  {
    const store = createStore(
      immer(() => {
        return o;
      }),
    );
    store.setState((s) => {
      s.a.v = 0;
      s.b.v = 1;
    });
    let next = store.getState();
    // same
    assert(o.a === next.a);
    assert(o.b !== next.b);
    assert(!Object.isFrozen(next)); // not frozen
    // all frozen
    assert(Object.isFrozen(next.a));
    assert(!Object.isFrozen(next.b)); // DIFF
    assert(Object.isFrozen(next.c));

    // set by merge instead of produce
    store.setState({ b: o.b });
    next = store.getState();
    assert(o.b === next.b);

    assert(!Object.isFrozen(next)); // not frozen
    assert(Object.isFrozen(next.a)); // frozen
    assert(!Object.isFrozen(next.b)); // not frozen
  }

  {
    const state = {
      a: { v: 1 },
      b: { v: 1 },
      c: { v: 1 },
      d: { v: 1 },
    };
    const next = produce(state, (s) => {
      s.a.v++;
      s.b.v++;
      s.b.v--;
      s.c.v = 1;
    });

    assert(state !== next);
    assert(state.a !== next.a); // 变了
    assert(state.b !== next.b);
    assert.deepEqual(state.b, next.b); // 变了，但相同
    assert(state.c === next.c); // 没变
    assert(state.d === next.d); // 没变

    assert(Object.isFrozen(next));
    assert(Object.isFrozen(next.a));
    assert(Object.isFrozen(next.b));
    assert(Object.isFrozen(next.c)); // 没变 依然 frozen
    assert(Object.isFrozen(next.d)); // frozen
  }
});

test('mutative custom', async () => {
  class Foo {
    bar = 'bar';
  }

  const baseState = {
    foo: new Foo(),
    simpleObject: Object.create(null),
    plain: {} as Record<string, any>,
    version: 1,
  };

  // 支持 async
  const [state, patches] = await create(
    baseState,
    async (draft) => {
      draft.foo.bar = 'new str';
      draft.simpleObject.a = 'a';
      draft.plain.b = 1;

      draft.version++;
    },
    {
      mark: markSimpleObject,
      enablePatches: true,
      // enableAutoFreeze: true,
    },
  );

  // 简单对象被认为是 immutable 的
  expect(state.simpleObject).not.toBe(baseState.simpleObject);
  expect(state.plain).not.toBe(baseState.plain);
  // not frozen
  expect(!Object.isFrozen(state.simpleObject)).toBeTruthy();
  expect(!Object.isFrozen(state.plain)).toBeTruthy();
  // expect(!Object.isFrozen(state.foo)).toBeTruthy();
  // 未被标记可变，因此可修改
  expect(state.foo).toBe(baseState.foo);
  // mutable 的不会被记录
  expect(patches).toEqual([
    { op: 'add', path: ['plain', 'b'], value: 1 },
    { op: 'add', path: ['simpleObject', 'a'], value: 'a' },
    { op: 'replace', path: ['version'], value: 2 },
  ]);
});
