import type { RouteObject } from 'react-router-dom';
import { createHashRoutes } from '../modules/hash/createHashRoutes';
import { createIpfsRoutes } from '../modules/ipfs/createIpfsRoutes';
import { createPasswordRoutes } from '../modules/password/createPasswordRoutes';
import { createSystemRoutes } from '../modules/system/createSystemRoutes';
import { createToolRoutes } from '../modules/tool/createToolRoutes';

export function createRoutes(): RouteObject[] {
  return [
    ...createIpfsRoutes(),
    ...createHashRoutes(),
    ...createSystemRoutes(),
    ...createPasswordRoutes(),
    ...createToolRoutes(),
  ];
}
