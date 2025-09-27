import { isDevelopment, isProduction } from 'std-env';

/* @__PURE__ */
export function isProd() {
	return isProduction;
}

/* @__PURE__ */
export function isDev() {
	return isDevelopment;
}

/* @__PURE__ */
export function isBuilding() {
	return process.env.NEXT_PHASE === 'phase-production-build';
}
