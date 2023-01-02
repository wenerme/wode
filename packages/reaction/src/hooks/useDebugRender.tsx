import { useMemo, useRef } from 'react';
import type { Logger } from '@wener/utils';
import { createLogger, createNoopLogger } from '@wener/utils';

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
export function useDebugRender(o: any, ...rest: any[]): DebugRenderLogger & Logger {
  if (process.env.NODE_ENV === 'production') {
    return useMemo(() => Object.assign(() => undefined, createNoopLogger()), []);
  }

  const counterRef = useRef(0);
  counterRef.current++;

  const { name, onRender, id = undefined, logger = console } = typeof o === 'string' ? { name: o, onRender: true } : o;
  const pref = id ? `[${name}@${id}]` : `[${name}]`;
  const log = useMemo(() => {
    const l = createLogger(({ level, values }) => {
      let message = '';
      if (typeof values[0] === 'string') {
        message = values.shift();
      }
      logger[level](`${pref}#${counterRef.current}${message ? `: ${message}` : ''}`, ...values);
    });
    return Object.assign(l.debug, l);
  }, [name]);
  if (onRender) {
    log(`Render`, ...rest);
  }
  return log;
}

export type DebugRenderLogger = (...args: any[]) => void;
