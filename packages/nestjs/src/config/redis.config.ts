import { z } from 'zod';
import { App } from '../app/App';

export const RedisConfig = z.object({
  dsn: z.string().optional(),
  host: z.string().optional().default('127.0.0.1'),
  port: z.coerce.number().default(6379).catch(6379),
  username: z.string().optional(),
  password: z.string().optional(),
  db: z.coerce.number().optional(),
});
export type RedisConfig = z.infer<typeof RedisConfig>;

export function getRedisConfig(env = process.env) {
  let { REDIS_URL, REDIS_DSN = REDIS_URL, REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD, REDIS_DB } = env;
  if (REDIS_DSN) {
    try {
      // redis, rediss
      const u = new URL(REDIS_DSN);
      REDIS_HOST ||= u.hostname;
      REDIS_PORT ||= u.port;
      REDIS_USERNAME ||= u.username;
      REDIS_PASSWORD ||= u.password;
    } catch (e) {}
  }
  return RedisConfig.parse({
    dsn: REDIS_DSN,
    host: REDIS_HOST,
    port: REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    db: REDIS_DB,
    /*
  connectTimeout: 10000,
  disconnectTimeout: 2000,
     */
  });
}

export function getRedisOptions() {
  // https://github.com/redis/ioredis/blob/main/lib/redis/RedisOptions.ts
  const { port, host, username, password, db } = getRedisConfig();
  return { port, host, username, password, db, connectionName: App.instanceId };
}
