import * as nodeFetch from 'node-fetch';
import { beforeAll, expect, test } from 'vitest';
import { polyfillBrowser } from './polyfillBrowser';
import { polyfillFetch } from './polyfillFetch';

beforeAll(async () => {
  // return false in nodejs18
  polyfillFetch(nodeFetch);
  expect(polyfillFetch()).toBeFalsy();
  await polyfillBrowser();
});

test('polyfillBrowser', () => {
  expect(fetch).toBeTruthy();
  expect(window).toBeTruthy();
  expect(document).toBeTruthy();
  expect(crypto).toBeTruthy();
  // not the same
  expect(window).not.toBe(globalThis);
});
