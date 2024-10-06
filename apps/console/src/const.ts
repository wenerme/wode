import { getGlobalThis } from '@wener/utils';

let NODE_ENV: any;
let NEXT_PHASE: any;
try {
  NODE_ENV = process.env.NODE_ENV;
  NEXT_PHASE = process.env.NEXT_PHASE;
  if (typeof window === 'undefined') {
    ({ NODE_ENV } = getGlobalThis().process?.env || {});
  }
} catch (e) {}

/* @__PURE__ */
export function isProd() {
  return NODE_ENV === 'production';
}

/* @__PURE__ */
export function isDev() {
  return NODE_ENV === 'development';
}

/* @__PURE__ */
export function isBuilding() {
  return NEXT_PHASE === 'phase-production-build';
}
