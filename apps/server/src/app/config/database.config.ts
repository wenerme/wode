import { z } from 'zod';
import { registerAs } from '@nestjs/config';

export const DatabaseConfig = z.object({
  dsn: z.coerce.string().optional(),
  debug: z.coerce.boolean().optional().default(false),
});
export type DatabaseConfig = z.infer<typeof DatabaseConfig>;

export const databaseConfig = registerAs('database', () => {
  const { DB_DSN, DATABASE_DSN = DB_DSN, DATABASE_DEBUG } = process.env;
  return DatabaseConfig.parse({
    dsn: DATABASE_DSN,
    debug: DATABASE_DEBUG,
  });
});
