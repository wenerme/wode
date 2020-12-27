import { DependencyList, useEffect, useRef } from 'react';

export function useAsyncEffect(
  effect: (o: { controller: AbortController }) => Promise<void | (() => void | undefined)>,
  deps?: DependencyList,
): { getAbortController: () => AbortController | undefined } {
  const ref = useRef<AbortController>();
  useEffect(() => {
    ref.current = new AbortController();
    effect({ controller: ref.current })
      .catch((e) => {
        console.trace(`uncaught useAsyncEffect error`, deps, e);
      });
    return () => ref.current?.abort();
  }, deps);
  return { getAbortController: () => ref.current };
}
