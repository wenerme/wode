import type { Logger, Writer } from './types';

export let logger: Logger = console;
export function setLogger(l: Logger) {
	logger = l;
}

export function createNoopLogger(): Logger {
	const noop: Writer = () => {};
	return {
		log: noop,
		info: noop,
		warn: noop,
		error: noop,
		debug: noop,
		trace: noop,
	};
}
