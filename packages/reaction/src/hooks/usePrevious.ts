import { useRef } from 'react';
import { Equivalence } from '../typing';

/**
 * usePrevious will return previous value without state change
 * @deprecated prefer {@link createDeepCompareHooks} {@link useDeepCompareMemoize} {@link useCompareEffect}
 * @param val
 * @param equal
 */
export function usePrevious<T = any>(val: T, equal: Equivalence<T | undefined> = (a, b) => a === b) {
  const ref = useRef<T>();
  if (!equal(ref.current, val)) {
    ref.current = val;
  }
  return ref.current;
}
