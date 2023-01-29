import { createIpfsRoutes as createRoutes } from './createIpfsRoutes';

export { createIpfsRoutes, createIpfsRoutes as createRoutes } from './createIpfsRoutes';

export function createModule() {
  return {
    id: '@wener/apis/ipfs',
    createRoutes,
  };
}
