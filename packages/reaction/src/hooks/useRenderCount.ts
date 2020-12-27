import React from 'react';

export function useRenderCount() {
  const ref = React.useRef(0);
  return ref.current++;
}
