import { z } from 'zod';
import { parseBoolean } from '@wener/utils';

export const DatabaseConfig = z.object({
  dsn: z.coerce.string().optional(),
  debug: z.coerce.boolean().optional().default(false),
});
export type DatabaseConfig = z.infer<typeof DatabaseConfig>;

export function getDatabaseConfig(env = process.env) {
  const { DB_DSN, DATABASE_DSN = DB_DSN, DB_DEBUG, DATABASE_DEBUG = DB_DEBUG } = env;
  return DatabaseConfig.parse({
    dsn: DATABASE_DSN,
    debug: parseBoolean(DATABASE_DEBUG),
  });
}
