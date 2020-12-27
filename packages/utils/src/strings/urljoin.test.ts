import { urljoin } from './urljoin';

test('join ext', () => {
  expect(urljoin('http://wener.me/sub/index.html', './hello.js')).toBe('http://wener.me/sub/hello.js');
});
