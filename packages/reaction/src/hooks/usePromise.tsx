import { useEffect, useState } from 'react';

export function usePromise<T>(f: (opts: { signal: AbortSignal }) => Promise<T>, deps: any[]) {
  const [counter, setCounter] = useState(0);
  const [state, setState] = useState<{
    loading: boolean;
    data?: T;
    error?: any;
    state: 'pending' | 'fulfilled' | 'rejected';
    refetch: () => void;
  }>(() => ({
    loading: true,
    state: 'pending',
    refetch: () => {
      setCounter(counter + 1);
    },
  }));
  useEffect(() => {
    setState((last) => {
      return {
        ...last,
        loading: true,
        data: undefined,
        error: undefined,
        state: 'pending',
      };
    });
    const ac = new AbortController();
    f({
      signal: ac.signal,
    })
      .then((data) => {
        if (ac.signal.aborted) {
          return;
        }
        setState((last) => {
          return {
            ...last,
            loading: false,
            data: data as any,
            error: null,
            state: 'fulfilled',
          };
        });
      })
      .catch((error) => {
        if (ac.signal.aborted) {
          return;
        }
        setState((last) => {
          return {
            ...last,
            loading: false,
            error,
            state: 'rejected',
          };
        });
      });
    return () => {
      ac.abort();
    };
  }, [counter, ...deps]);
  return state;
}
