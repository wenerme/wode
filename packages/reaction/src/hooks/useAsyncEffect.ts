import { DependencyList, useEffect, useRef } from 'react';

/**
 * useAsyncEffect accept async function call, which can accept an AbortController and return a Promise
 * @param effect Effect function
 * @param deps DependencyList
 */
export function useAsyncEffect(
  effect: (o: { signal: AbortSignal }) => Promise<void | (() => void | undefined)>,
  deps?: DependencyList,
): { abort: () => void } {
  const abortRef = useRef<() => void>();
  useEffect(() => {
    let abortController = new AbortController();
    abortRef.current = () => abortController.abort();
    effect({ signal: abortController.signal }).catch((e) => {
      console.trace(`uncaught useAsyncEffect error`, deps, e);
    });
    return () => abortController.abort();
  }, deps);
  return { abort: abortRef.current ?? (() => void 0) };
}
