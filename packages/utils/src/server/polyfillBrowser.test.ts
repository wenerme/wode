import test from 'ava';
import { polyfillBrowser } from './polyfillBrowser';

test.before(async () => {
  await polyfillBrowser();
});

test('polyfillBrowser', (t) => {
  t.truthy(fetch);
  t.truthy(window);
  t.truthy(document);
  t.truthy(crypto);
  // not the same
  t.not(window, globalThis);
});
