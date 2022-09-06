import { useCallback, useRef } from 'react';

/**
 * useDebugRender will log a message when component render with render count
 * @param name component name
 * @param rest rest params to log - if the first param is a string, it will be used as message
 */
export function useDebugRender(name: string, ...rest: any[]): DebugRenderLogger;
export function useDebugRender(options: { name: string; onRender?: boolean }, ...rest: any[]): DebugRenderLogger;
export function useDebugRender(o: any, ...rest: any[]): DebugRenderLogger {
  if (process.env.NODE_ENV === 'production') {
    return () => void 0;
  }

  const counterRef = useRef(0);
  counterRef.current++;

  const { name, onRender } = typeof o === 'string' ? { name: o, onRender: true } : o;
  const l = useCallback(
    (...args: any[]) => {
      let message = '';
      if (typeof args[0] === 'string') {
        message = args.shift();
      }
      console.debug(`[${name}]#${counterRef.current}${message ? `: ${message}` : ''}`, ...rest);
    },
    [name],
  );
  if (onRender) {
    l(`Render`, ...rest);
  }
  return l;
}

export type DebugRenderLogger = (...args: any[]) => void;
