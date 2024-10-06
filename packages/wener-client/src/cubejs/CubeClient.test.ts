import { test } from 'vitest';
import { CubeClient } from './CubeClient';

test.skipIf(true)('CubeClient', async () => {
  const client = new CubeClient({
    endpoint: 'http://127.0.0.1:4000',
    fetch,
  });

  try {
    console.log(await client.livez());
  } catch {
    console.warn('CubeClient: skip');
    return;
  }

  console.log(
    await client.load({
      query: {
        measures: ['users.count'],
        timeDimensions: [
          {
            dimension: 'users.created_at',
            dateRange: 'Today',
          },
        ],
        order: {
          'users.count': 'desc',
        },
        dimensions: ['users.province'],
        timezone: 'Asia/Shanghai',
      },
    }),
  );
});
