import * as pg from 'pg';
import type { Dialect, InitOptions} from '@sequelize/core';
import { Sequelize } from '@sequelize/core';

export interface CreateSequelizeOptions {
  name?: string;
  dsn?: string;
  type?: string;
  init?: (o: InitOptions) => void;
}

export function createSequelize({ name, dsn, type, init }: CreateSequelizeOptions = {}) {
  if (name) {
    dsn ||= process.env[`${name.toUpperCase()}_DB_DSN`];
    type ||= process.env[`${name.toUpperCase()}_DB_TYPE`];
  } else {
    dsn ||= process.env.DB_DSN;
    type ||= process.env.DB_TYPE;
  }
  if (!dsn) {
    throw new Error('DB_DSN is not set');
  }
  const dialect = normalizeDialect(type);
  // 运行时 require('pg') 可能失败
  const sequelize = new Sequelize(dsn, {
    dialect,
    timezone: 'Asia/Shanghai',
    // maybe esm
    dialectModule: dialect === 'postgres' ? ((pg as any).Client ? pg : (pg as any).default) : undefined,
    // dialectModulePath: '/usr/local/lib/node_modules/pg',
    dialectOptions: {},
    logging: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true' ? console.log : false,
    logQueryParameters: process.env.DEBUG === 'true',
  });
  init?.({ sequelize });
  return sequelize;
}

function normalizeDialect(s?: string): Dialect {
  switch (s) {
    case 'sqlite':
    case 'sqlite3':
      return 'sqlite';
    case 'postgresql':
    case 'pg':
    case 'postgres':
      return 'postgres';
    case 'mysql':
    case 'mariadb':
    case 'mssql':
    case 'db2':
    case 'snowflake':
    case 'ibmi':
      return s;
    default:
      throw new Error(`Unknown dialect ${s}`);
  }
}
