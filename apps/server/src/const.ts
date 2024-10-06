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
export function isTest() {
  // https://jestjs.io/docs/environment-variables
  // https://github.com/vitest-dev/vitest/blob/a7be50dbceea31611403542caca7ebf44e4e014a/packages/vitest/src/node/cli/cli-api.ts#L128-L130
  /*
Vitest
  TEST=true
  VITEST=true
  NODE_ENV=test
   */
  return NODE_ENV === 'test';
}

/* @__PURE__ */
export function isBuilding() {
  return NEXT_PHASE === 'phase-production-build';
}

export function isEnv(env: string) {
  return NODE_ENV === env;
}
