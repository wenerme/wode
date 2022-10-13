import { useCallback, useRef } from 'react';
import type { Logger } from '@wener/utils';

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
  if (process.env.NODE_ENV === 'production') {
    return () => undefined;
  }

  const counterRef = useRef(0);
  counterRef.current++;

  const { name, onRender, id = undefined, logger = console } = typeof o === 'string' ? { name: o, onRender: true } : o;
  const pref = id ? `[${name}@${id}]` : `[${name}]`;
  const l = useCallback(
    (...args: any[]) => {
      let message = '';
      if (typeof args[0] === 'string') {
        message = args.shift();
      }
      logger.debug(`${pref}#${counterRef.current}${message ? `: ${message}` : ''}`, ...args);
    },
    [name],
  );
  if (onRender) {
    l(`Render`, ...rest);
  }
  return l;
}

export type DebugRenderLogger = (...args: any[]) => void;
