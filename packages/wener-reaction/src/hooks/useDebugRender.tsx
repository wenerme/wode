import { useMemo, useRef } from 'react';
import { logger as _logger, createNoopLogger, type Logger } from '@wener/utils/logger';

/**
 * useDebugRender will log a message when component render with render count
 * @param name component name
 * @param rest rest params to log - if the first param is a string, it will be used as message
 */
export function useDebugRender(name: string, ...rest: any[]): DebugRenderLogger;
export function useDebugRender(
	options: { name: string; id?: string; onRender?: boolean; logger?: Logger },
	...rest: any[]
): DebugRenderLogger;
export function useDebugRender(o: any, ...rest: any[]): DebugRenderLogger {
	const counterRef = useRef(0);

	if (process.env.NODE_ENV === 'production') {
		return useMemo(() => Object.assign(() => undefined, createNoopLogger()), []);
	}
	counterRef.current++;

	const { name, onRender, id = undefined, logger = _logger } = typeof o === 'string' ? { name: o, onRender: true } : o;
	const log = useMemo(() => {
		const pref = id ? `[${name}@${id}]` : `[${name}]`;
		return (...values: any[]) => {
			let message = '';
			if (typeof values[0] === 'string') {
				message = values.shift();
			}
			logger.log(`${pref}#${counterRef.current}${message ? `: ${message}` : ''}`, ...values);
		};
	}, [name]);
	if (onRender) {
		log(`Render`, ...rest);
	}
	return log;
}

export type DebugRenderLogger = (...args: any[]) => void;
