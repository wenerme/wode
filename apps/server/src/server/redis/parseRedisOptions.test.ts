import { expect, test } from 'vitest';
import { parseRedisOptions } from '@/server/redis/parseRedisOptions';

test('parseRedisOptions', () => {
  expect(parseRedisOptions('redis://redis/1')).toMatchObject({
    host: 'redis',
    port: 6379,
    db: 1,
  });
});
