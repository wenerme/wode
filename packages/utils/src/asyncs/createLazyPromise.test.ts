import test from 'ava';
import { createLazyPromise } from './createLazyPromise';
import { sleep } from './sleep';

test('basic', async (t) => {
  const promise = createLazyPromise();
  let r = 0;
  promise.then((v) => (r = v));
  t.is(r, 0);
  const { resolve, reject } = promise;
  t.truthy(resolve);
  t.truthy(reject);
  resolve(1);
  t.is(r, 0);
  await promise;
  t.is(r, 1);
});

test('manual resolve skip exec', async (t) => {
  const promise = createLazyPromise(() => {
    t.fail();
  });
  promise.resolve(-1);
  t.is(await promise, -1);
});

test('exec', async (t) => {
  let r = 0;
  const promise = createLazyPromise((resolve) => {
    r++;
    resolve(10);
  });
  await sleep(10);
  t.is(r, 0);
  t.is(await promise, 10);
  t.is(r, 1);
  promise.resolve(20);
  t.is(await promise, 10);
});
