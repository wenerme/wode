import { urljoin } from './urljoin';

test('join ext', () => {
  expect(urljoin('http://wener.me/sub/', '/a/', '/hello.js')).toBe('http://wener.me/sub/a/hello.js');
});
