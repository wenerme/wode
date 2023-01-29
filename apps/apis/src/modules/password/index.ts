import { createPasswordRoutes as createRoutes } from './createPasswordRoutes';

export { createPasswordRoutes, createPasswordRoutes as createRoutes } from './createPasswordRoutes';

export function createModule() {
  return {
    id: '@wener/apis/password',
    createRoutes,
  };
}
