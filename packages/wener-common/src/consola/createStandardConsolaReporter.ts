import type { ConsolaOptions, ConsolaReporter, LogObject } from 'consola/core';
import { formatLogObject } from './formatLogObject';

type Formatter = (
	o: LogObject,
	ctx: {
		options: ConsolaOptions;
	},
) => string;

export function createStandardConsolaReporter({
	format = formatLogObject,
}: {
	format?: Formatter;
} = {}): ConsolaReporter {
	return {
		log: (o, ctx) => {
			let out = format(o, ctx);
			let fn = console.log;

			const { level } = o;
			if (level < 1) {
				fn = console.error;
			} else if (level === 1) {
				fn = console.warn;
			}

			fn(out);
		},
	};
}
