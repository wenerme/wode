import type { DependencyList} from 'react';
import { useEffect, useMemo } from 'react';

/**
 * useAbortController provide a AbortController for fetch like action, when unmount will abort the current action.
 * @param deps DependencyList when changed, will abort previous AbortController
 */
export function useAbortController(deps?: DependencyList): AbortController {
  const controller = useMemo(() => new AbortController(), deps);
  useEffect(() => {
    return () => controller.abort();
  }, deps);
  return controller;
}
