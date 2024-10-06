import { test } from 'vitest';
import { verifyNetflixProxy } from './verifyNetflixProxy';

test(
  'verify',
  async () => {
    console.log(
      await verifyNetflixProxy({
        proxy: `http://127.0.0.1:7890`,
      }),
    );
  },
  {
    timeout: 60_000,
  },
);
