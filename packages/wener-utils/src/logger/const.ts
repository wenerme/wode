import type { Logger, Writer } from './types';

export let logger: Logger = console;

export function createLogger(): Logger {
	return logger;
}

export function setLogger(l: Logger) {
	logger = l;
}

export function createChildLogger(parent: Logger, context: Record<string, unknown>): Logger {
	const child = {} as Logger;
	for (const level of ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const) {
		child[level] = (message?: any, ...args: any[]) => {
			if (message === undefined) {
				parent[level](context, ...args);
				return;
			}
			parent[level](context, message, ...args);
		};
	}
	return child;
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

export const silent = createNoopLogger();
