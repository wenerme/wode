import type { DependencyList } from 'react';
import { useEffect, useRef } from 'react';

/**
 * useTimeout will set up a timer to call the {@param handler} after the {@param delay}
 * @param delay - the delay in milliseconds, -1 will disable the timeout
 * @param deps - reset timer when deps change - defaults to [delay]
 */
export function useTimeout(handler: () => void, delay: number, deps: DependencyList = [delay]) {
  const ref = useRef<any>();
  const clear = () => {
    ref.current && clearTimeout(ref.current);
  };
  useEffect(() => {
    if (delay < 0) {
      return;
    }
    ref.current = setTimeout(handler, delay);
    return clear;
  }, deps);
  return clear;
}
