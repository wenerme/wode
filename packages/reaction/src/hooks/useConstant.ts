import React from 'react';

/**
 * create only once
 *
 * @see https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
 * @see https://github.com/Andarist/use-constant/blob/master/src/index.ts
 */
export function useConstant<T>(fn: () => T): T {
  const ref = React.useRef<{ v: T }>();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
}
