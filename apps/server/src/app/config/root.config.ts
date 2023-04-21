import { z } from 'zod';
import { DatabaseConfig } from './database.config';
import { RedisConfig } from './redis.config';
import { ServerConfig } from './server.config';

export const RootConfig = z.object({
  server: ServerConfig,
  database: DatabaseConfig,
  redis: RedisConfig,
});
export type RootConfig = z.infer<typeof RootConfig>;
