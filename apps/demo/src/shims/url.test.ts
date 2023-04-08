import path from 'node:path';
import { test, assert } from 'vitest';

test('resolve', () => {
  assert.equal(path.resolve('/a/b', 'c'), '/a/b/c');
  assert.equal(path.resolve('c', '/a/b'), '/a/b');

  assert.equal(new URL('c', 'file://a/b').href, 'file://a/c');
  // hostname lowercase
  assert.equal(new URL('x', 'file://User/Wener/xyz').href, 'file://user/Wener/x');
  // fake hostname
  assert.equal(new URL('x', 'file://x/User/Wener/xyz').pathname, '/User/Wener/x');
  assert.equal(new URL('../x', 'file://x/User/Wener/xyz').pathname, '/User/x');
  // no hostname
  assert.equal(new URL('x', 'file:///User/Wener/xyz').pathname, '/User/Wener/x');
  assert.equal(new URL('x', 'file:///User/Wener/xyz').href, 'file:///User/Wener/x');
});
