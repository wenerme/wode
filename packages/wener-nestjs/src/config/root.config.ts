import { z } from 'zod';
import { DatabaseConfig, getDatabaseConfig } from './database.config';
import { getMinioConfig, MinioConfig } from './minio.config';
import { getNatsConfig, NatsConfig } from './nats.config';
import { getRedisConfig, RedisConfig } from './redis.config';
import { getServerConfig, ServerConfig } from './server.config';

export const RootConfig = z.object({
  server: ServerConfig,
  database: DatabaseConfig,
  redis: RedisConfig,
  nats: NatsConfig,
  minio: MinioConfig,
});

export type RootConfig = z.infer<typeof RootConfig>;

export function getRootConfig(env = process.env): RootConfig {
  return {
    server: getServerConfig(env),
    database: getDatabaseConfig(env),
    redis: getRedisConfig(env),
    nats: getNatsConfig(env),
    minio: getMinioConfig(env),
  };
}
