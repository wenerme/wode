import { isDevelopment, isProduction } from 'std-env';

export function isProd() {
	return isProduction;
}

export function isDev() {
	return isDevelopment;
}

export function isBuilding() {
	return process.env.NEXT_PHASE === 'phase-production-build';
}
