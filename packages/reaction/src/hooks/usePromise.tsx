import { useEffect, useState } from 'react';

export function usePromise<T>(f: (opts: { signal: AbortSignal }) => Promise<T>, deps: any[]) {
  const [state, setState] = useState(() => ({
    loading: true,
    data: null,
    error: null,
    state: 'pending',
  }));
  useEffect(() => {
    setState({ loading: true, data: null, error: null, state: 'pending' });
    const ac = new AbortController();
    f({
      signal: ac.signal,
    })
      .then((data) => {
        setState({ loading: false, data: data as any, error: null, state: 'fulfilled' });
      })
      .catch((error) => {
        setState({ loading: false, data: null, error, state: 'rejected' });
      });
    return () => {
      ac.abort();
    };
  }, deps);
  return state;
}
