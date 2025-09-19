import type { Logger } from './types';

export let logger: Logger = console;
export function setLogger(l: Logger) {
	logger = l;
}

export function createNoopLogger(): Logger {
	const noop = () => {};
	return {
		log: noop,
		info: noop,
		warn: noop,
		error: noop,
		debug: noop,
		trace: noop,
	} as any;
}
