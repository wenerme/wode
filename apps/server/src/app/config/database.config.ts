import { z } from 'zod';
import { registerAs } from '@nestjs/config';

export const DatabaseConfig = z.object({
  dsn: z.coerce.string().optional(),
});
export type DatabaseConfig = z.infer<typeof DatabaseConfig>;

export const databaseConfig = registerAs('database', () => {
  const { DB_DSN, DATABASE_DSN = DB_DSN } = process.env;
  return DatabaseConfig.parse({
    dsn: DATABASE_DSN,
  });
});
