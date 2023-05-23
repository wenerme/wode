import { assert, beforeAll, test } from 'vitest';
import { requireResponseOk } from '../app/util/requireResponseOk';
import { createFetchWithProxyByUndici } from './createFetchWithProxyByUndici';
import { loadEnvs } from './loadEnvs';

beforeAll(async () => {
  await loadEnvs();
});

test('fetch with proxy', async () => {
  if (!process.env.FETCH_PROXY) {
    return;
  }

  const fetch = createFetchWithProxyByUndici({
    proxy: process.env.FETCH_PROXY,
  });

  assert.notEqual(
    await globalThis
      .fetch('http://icanhazip.com')
      .then(requireResponseOk)
      .then((v) => v.text()),
    await fetch('http://icanhazip.com')
      .then(requireResponseOk)
      .then((v) => v.text()),
  );
});
