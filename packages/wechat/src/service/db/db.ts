import { Sequelize } from '@sequelize/core';
import type { Dialect } from '@sequelize/core/types/sequelize';
import { createLazyPromise } from '@wener/utils';
import { initModels } from './models';

const _sequelize = createLazyPromise(async () => {
  const { DB_DSN: dsn, DB_TYPE: type } = process.env;
  if (!dsn) {
    throw new Error('DB_DSN is not set');
  }
  const sequelize = new Sequelize(dsn, {
    dialect: normalizeDialect(type),
    timezone: 'Asia/Shanghai',
    dialectOptions: {},
  });
  await sequelize.authenticate();
  await initModels({ sequelize });
  return sequelize;
});

export function getSequelize() {
  return _sequelize;
}

function normalizeDialect(s?: string): Dialect {
  switch (s) {
    case 'sqlite':
    case 'sqlite3':
      return 'sqlite';
    case 'postgresql':
    case 'pg':
      return 'postgres';
  }
  return s as Dialect;
}
