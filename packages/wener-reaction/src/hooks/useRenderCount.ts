import React from 'react';

/**
 * useRenderCount return a count of render times
 */
export function useRenderCount() {
  const ref = React.useRef(0);
  return ++ref.current;
}
