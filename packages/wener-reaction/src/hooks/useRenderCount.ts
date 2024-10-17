import { useRef } from 'react';

/**
 * useRenderCount return a count of render times
 */
export function useRenderCount() {
  const ref = useRef(0);
  return ++ref.current;
}
