import test from 'ava';
import { urljoin } from './urljoin';

test('join ext', (t) => {
  t.is(urljoin('http://wener.me/sub/', '/a/', '/hello.js'), 'http://wener.me/sub/a/hello.js');
});
