import { DependencyList, useEffect, useMemo } from 'react';

export function useAbortController(deps?: DependencyList): AbortController {
  const controller = useMemo(() => new AbortController(), deps);
  useEffect(() => {
    return () => controller.abort();
  }, deps);
  return controller;
}
