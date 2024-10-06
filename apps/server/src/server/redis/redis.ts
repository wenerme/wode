import { Redis } from 'ioredis';
import { parseRedisOptions } from './parseRedisOptions';

export function createRedis() {
  let opts = parseRedisOptions({
    url: process.env.REDIS_URL,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  });
  return new Redis({
    maxRetriesPerRequest: null,
    ...opts,
  });
}
