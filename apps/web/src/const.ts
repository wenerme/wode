import { getGlobalThis } from '@wener/utils';

export function isServer() {
  return typeof window === 'undefined';
}

export function isClient() {
  return typeof window !== 'undefined';
}

/* @__PURE__ */
export function isProd() {
  return NODE_ENV === 'production';
}

/* @__PURE__ */
export function isDev() {
  return NODE_ENV === 'development';
}

let NODE_ENV: any;
let NEXT_PHASE: any;
try {
  NODE_ENV = process.env.NODE_ENV;
  NEXT_PHASE = process.env.NEXT_PHASE;
  if (typeof window === 'undefined') {
    ({ NODE_ENV, NEXT_PHASE } = getGlobalThis().process?.env || {});
  }
} catch (e) {}

/* @__PURE__ */
export function isNextBuilding() {
  return NEXT_PHASE === 'phase-production-build';
}
