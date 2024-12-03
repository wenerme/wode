import { useRef } from 'react';
import { deepEqual } from '@wener/utils';

export function useDeepEqual<S, U>(selector: (state: S) => U): (state: S) => U {
  // https://github.com/pmndrs/zustand/blob/main/src/react/shallow.ts
  const prev = useRef<U>();
  return (state) => {
    const next = selector(state);
    return deepEqual(prev.current, next) ? (prev.current as U) : (prev.current = next);
  };
}
