import React from 'react';
import { useLatestValue } from './useLatestValue';

/**
 * @see https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
 */
export let useEvent = function useEvent<
  F extends (...args: any[]) => any,
  P extends any[] = Parameters<F>,
  R = ReturnType<F>,
>(cb: (...args: P) => R) {
  let cache = useLatestValue(cb);
  return React.useCallback((...args: P) => cache.current(...args), [cache]);
};
