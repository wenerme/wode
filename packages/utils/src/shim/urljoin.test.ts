import { urljoin } from './urljoin';
import test from 'ava';

test('join ext', (t) => {
  t.is(urljoin('http://wener.me/sub/', '/a/', '/hello.js'), 'http://wener.me/sub/a/hello.js');
});
