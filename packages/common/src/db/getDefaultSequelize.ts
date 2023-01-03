import type { Sequelize } from '@sequelize/core';
import type { CreateSequelizeOptions } from './createSequelize';
import { createSequelize } from './createSequelize';

const _instances: Record<string, Sequelize> = {};

export function getDefaultSequelize(name?: string | CreateSequelizeOptions) {
  const o: CreateSequelizeOptions = typeof name === 'string' ? { name } : name || {};
  return (_instances[o.name || 'default'] ||= createSequelize(o));
}
