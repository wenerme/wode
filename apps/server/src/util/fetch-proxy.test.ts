import { assert, beforeAll, test } from 'vitest';
import { createFetchWithProxyByUndici } from './createFetchWithProxyByUndici';
import { loadEnvs } from './loadEnvs';
import { requireResponseOk } from './requireResponseOk';

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
