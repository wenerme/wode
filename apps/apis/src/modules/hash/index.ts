import { createHashRoutes as createRoutes } from './createHashRoutes';

export { createHashRoutes, createHashRoutes as createRoutes } from './createHashRoutes';

export function createModule() {
  return {
    id: '@wener/apis/hash',
    createRoutes,
  };
}
