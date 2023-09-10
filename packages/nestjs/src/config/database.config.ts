import { z } from 'zod';
import { parseBoolean } from '@wener/utils';

export const DatabaseConfig = z.object({
  type: z.string().optional(),
  dsn: z.coerce.string().optional(),
  debug: z.coerce.boolean().optional().default(false),
});
export type DatabaseConfig = z.infer<typeof DatabaseConfig>;

export function getDatabaseConfig(env = process.env) {
  const { DB_TYPE, DB_DSN, DATABASE_DSN = DB_DSN, DB_DEBUG, DATABASE_DEBUG = DB_DEBUG } = env;
  return DatabaseConfig.parse({
    type: DB_TYPE,
    dsn: DATABASE_DSN,
    debug: parseBoolean(DATABASE_DEBUG),
  });
}

export function getMikroOrmConfig() {
  const { debug, dsn } = getDatabaseConfig();
  return {
    clientUrl: dsn,
    debug,
  };
}

/*
export interface ConnectionOptions {
    dbName?: string;
    schema?: string;
    name?: string;
    clientUrl?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string | (() => MaybePromise<string> | MaybePromise<DynamicPassword>);
    charset?: string;
    collate?: string;
    multipleStatements?: boolean;
    pool?: PoolConfig;
}
 */
