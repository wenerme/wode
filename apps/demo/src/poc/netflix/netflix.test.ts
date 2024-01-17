import { test } from 'vitest';
import { verify } from './verify';

test(
  'verify',
  async () => {
    console.log(
      await verify({
        proxy: `http://127.0.0.1:7890`,
      }),
    );
  },
  {
    timeout: 60_000,
  },
);
