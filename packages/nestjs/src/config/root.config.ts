import { z } from 'zod';
import { DatabaseConfig, getDatabaseConfig } from './database.config';
import { getRedisConfig, RedisConfig } from './redis.config';
import { getServerConfig, ServerConfig } from './server.config';

export const RootConfig = z.object({
  server: ServerConfig,
  database: DatabaseConfig,
  redis: RedisConfig,
});

export type RootConfig = z.infer<typeof RootConfig>;

export function getRootConfig(env = process.env): RootConfig {
  return {
    server: getServerConfig(env),
    database: getDatabaseConfig(env),
    redis: getRedisConfig(env),
  };
}
