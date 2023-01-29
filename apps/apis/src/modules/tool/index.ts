import { createToolRoutes as createRoutes } from './createToolRoutes';

export { createToolRoutes, createToolRoutes as createRoutes } from './createToolRoutes';

export function createModule() {
  return {
    id: '@wener/apis/tool',
    createRoutes,
  };
}
