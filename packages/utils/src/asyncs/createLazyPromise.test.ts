import { test, expect } from 'vitest';
import { createLazyPromise } from './createLazyPromise';
import { sleep } from './sleep';

test('basic', async () => {
  const promise = createLazyPromise();
  let r = 0;
  void promise.then((v) => (r = v));
  expect(r).toBe(0);
  const { resolve, reject } = promise;
  expect(resolve).toBeTruthy();
  expect(reject).toBeTruthy();
  resolve(1);
  expect(r).toBe(0);
  await promise;
  expect(r).toBe(1);
});

test('manual resolve skip exec', async () => {
  const promise = createLazyPromise<number>(() => {
    expect.fail();
  });
  promise.resolve(-1);
  expect(await promise).toBe(-1);
});

test('exec', async () => {
  let r = 0;
  const promise = createLazyPromise((resolve) => {
    r++;
    resolve(10);
  });
  await sleep(10);
  expect(r).toBe(0);
  expect(await promise).toBe(10);
  expect(r).toBe(1);
  promise.resolve(20);
  expect(await promise).toBe(10);
});

test('exec auto', async () => {
  let r = 0;
  const promise = createLazyPromise(() => {
    r++;
    return 10;
  });
  await sleep(10);
  expect(r).toBe(0);
  void promise.then(() => undefined);
  expect(await promise).toBe(10);
  expect(r).toBe(1);
  expect(await promise).toBe(10);
  expect(r).toBe(1);
});
