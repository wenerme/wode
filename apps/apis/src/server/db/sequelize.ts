import { getDefaultSequelize } from 'common/src/db';
import { Sequelize } from '@sequelize/core';
import { initModels } from './models';

export function getSequelize() {
  return undefined as any as Sequelize;
  // return getDefaultSequelize({ init: initModels });
}
