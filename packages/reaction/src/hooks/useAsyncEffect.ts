import {DependencyList, useEffect, useRef} from 'react';

/**
 * useAsyncEffect accept a async function call, which can accept an AbortController and return a Promise
 * @param effect Effect function
 * @param deps DependencyList
 */
export function useAsyncEffect(
  effect: (o: { signal: AbortSignal }) => Promise<void | (() => void | undefined)>,
  deps?: DependencyList,
): { getAbortController: () => AbortController | undefined } {
  const ref = useRef<AbortController>();
  useEffect(() => {
    ref.current = new AbortController();
    effect({signal: ref.current?.signal})
      .catch((e) => {
        console.trace(`uncaught useAsyncEffect error`, deps, e);
      });
    return () => ref.current?.abort();
  }, deps);
  return {getAbortController: () => ref.current};
}
