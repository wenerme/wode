import { useEffect, useRef } from 'react';

export function useInterval(handler: TimerHandler, interval: number) {
  const ref = useRef<any>();
  useEffect(() => {
    if (!interval || interval < 0) {
      return;
    }
    ref.current = setInterval(handler, interval);
    return () => clearInterval(ref.current);
  }, [interval]);
}
