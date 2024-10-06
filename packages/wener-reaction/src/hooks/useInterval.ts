import { useEffect, useRef } from 'react';

/**
 * useInterval will call setInterval, when unmount will call clearInterval
 * @param handler
 * @param interval 0 means disable
 */
export function useInterval(handler: Function, interval: number) {
  const ref = useRef<any>();
  useEffect(() => {
    if (!interval || interval < 0) {
      return;
    }
    ref.current = setInterval(handler, interval);
    return () => clearInterval(ref.current);
  }, [interval]);
}
