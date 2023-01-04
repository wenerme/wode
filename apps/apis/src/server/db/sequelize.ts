import type { Sequelize } from '@sequelize/core';

export function getSequelize() {
  return undefined as any as Sequelize;
  // return getDefaultSequelize({ init: initModels });
}
