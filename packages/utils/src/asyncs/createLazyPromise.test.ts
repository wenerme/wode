import { describe, expect, test } from 'vitest';
import { createLazyPromise } from './createLazyPromise';

describe('basic', async () => {
  test('no executor', async () => {
    const promise = createLazyPromise();
    let r = 0;
    void promise.then((v) => (r = v));
    expect(r).toBe(0);
    const { resolve, reject } = promise;
    expect(resolve).toBeTruthy();
    expect(reject).toBeTruthy();

    // peek
    expect(promise.value).toBeUndefined();
    expect(promise.status).toBe('pending');
    resolve(1);
    expect(promise.value).toBe(1);
    expect(promise.status).toBe('resolved');

    expect(r).toBe(0);

    await promise;

    expect(r).toBe(1);
  });

  test('can resolve to lazy', async () => {
    const a = createLazyPromise(() => {
      return createLazyPromise(() => {
        return 10;
      });
    });

    expect(a.value).toBeUndefined();
    expect(a.status).toBe('pending');
    expect(await a).toBe(10);
    expect(a.status).toBe('resolved');
    expect(a.value).toBe(10);
  });

  test('can resolve to async lazy', async () => {
    const a = createLazyPromise(async () => {
      return createLazyPromise(async () => {
        return 10;
      });
    });
    expect(a.value).toBeUndefined();
    expect(a.status).toBe('pending');
    expect(await a).toBe(10);
    expect(a.status).toBe('resolved');
    expect(a.value).toBe(10);
  });
});

test('manual resolve skip exec', async () => {
  const promise = createLazyPromise<number>(() => {
    expect.fail('should not exec');
  });
  promise.resolve(-1);
  expect(await promise).toBe(-1);
  expect(String(promise)).toBe('[object LazyPromise]');
});

test('lazy exec resolve by manual', async () => {
  let r = 0;
  const promise = createLazyPromise((resolve) => {
    r++;
    resolve(10);
  });
  await Promise.resolve();
  expect(r).toBe(0);
  expect(await promise).toBe(10);
  expect(r).toBe(1);
  promise.resolve(20);
  expect(await promise).toBe(10);
  expect(r).toBe(1);
});

test('lazy exec resolve by return', async () => {
  let r = 0;
  const promise = createLazyPromise(() => {
    r++;
    return 10;
  });
  await Promise.resolve();
  expect(r).toBe(0);
  void promise.then(() => undefined);
  await Promise.resolve();
  // already resolved
  expect(r).toBe(1);
  expect(await promise).toBe(10);
  expect(r).toBe(1);
});
