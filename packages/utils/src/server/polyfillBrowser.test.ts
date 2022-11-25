import test from 'ava';
import * as nodeFetch from 'node-fetch';
import { polyfillBrowser } from './polyfillBrowser';
import { polyfillFetch } from './polyfillFetch';

test.before(async (t) => {
  t.true(polyfillFetch(nodeFetch));
  t.false(polyfillFetch());
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
