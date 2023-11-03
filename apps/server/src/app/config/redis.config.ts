import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const RedisConfig = z.object({
  dsn: z.string().optional(),
  host: z.string().optional().default('127.0.0.1'),
  port: z.coerce.number().optional().default(6379),
  username: z.string().optional(),
  password: z.string().optional(),
});
export type RedisConfig = z.infer<typeof RedisConfig>;

export const redisConfig = registerAs('redis', () => {
  const { REDIS_DSN, REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } = process.env;
  return RedisConfig.parse({
    dsn: REDIS_DSN,
    host: REDIS_HOST,
    port: REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
  });
});
