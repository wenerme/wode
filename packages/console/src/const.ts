import { getGlobalThis } from '@wener/utils';

let NODE_ENV = process?.env?.NODE_ENV;
const NEXT_PHASE = process?.env?.NEXT_PHASE;
if (typeof window === 'undefined') {
  ({ NODE_ENV } = getGlobalThis()?.process.env);
}

export function isProd() {
  return NODE_ENV === 'production';
}

export function isDev() {
  return NODE_ENV === 'development';
}

export function isBuilding() {
  return NEXT_PHASE === 'phase-production-build';
}
