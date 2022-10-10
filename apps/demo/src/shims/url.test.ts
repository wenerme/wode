import test from 'ava';
import path from 'node:path';

test('resolve', (t) => {
  t.is(path.resolve('/a/b', 'c'), '/a/b/c');
  t.is(path.resolve('c', '/a/b'), '/a/b');

  t.is(new URL('c', 'file://a/b').href, 'file://a/c');
  // hostname lowercase
  t.is(new URL('x', 'file://User/Wener/xyz').href, 'file://user/Wener/x');
  // fake hostname
  t.is(new URL('x', 'file://x/User/Wener/xyz').pathname, '/User/Wener/x');
  t.is(new URL('../x', 'file://x/User/Wener/xyz').pathname, '/User/x');
  // no hostname
  t.is(new URL('x', 'file:///User/Wener/xyz').pathname, '/User/Wener/x');
  t.is(new URL('x', 'file:///User/Wener/xyz').href, 'file:///User/Wener/x');
});
