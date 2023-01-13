import type { RouteObject } from 'react-router-dom';
import { createSettingRoutes } from 'common/src/system/setting';
import { createHashRoutes } from '../modules/hash';
import { createIpfsRoutes } from '../modules/ipfs';
import { createPasswordRoutes } from '../modules/password';
import { createToolRoutes } from '../modules/tool';

export function createRoutes(): RouteObject[] {
  return [
    ...createIpfsRoutes(),
    ...createHashRoutes(),
    ...createSettingRoutes(),
    ...createPasswordRoutes(),
    ...createToolRoutes(),
  ];
}
