import { getGlobalStates, requestIdleCallback } from '@wener/utils';
import { createStore, useStore } from 'zustand';

type NetworkStatusResult = {
  online: boolean;
  offline: boolean;
  status: 'online' | 'offline';
};

function getNetworkStatusStore() {
  return getGlobalStates('NetworkStatusStore', () => {
    return createStore<{ online: boolean }>((setState, getState, store) => {
      let close: () => void = () => void 0;
      requestIdleCallback(() => {
        close = watch((online) => setState({ online: online }));
      });
      return {
        online: typeof navigator === 'undefined' ? true : (navigator.onLine ?? true),
        close() {
          close();
        },
      };
    });
  });
}

export function useNetworkStatus() {
  useStore(getNetworkStatusStore());
  return getNetworkStatus();
}

export function getNetworkStatus(): NetworkStatusResult {
  const { online } = getNetworkStatusStore().getState();
  return {
    online,
    offline: !online,
    status: online ? 'online' : 'offline',
  };
}

function watch(setOnline: (v: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => void 0;
  const handleOffline = () => {
    setOnline(false);
  };
  const handleOnline = () => {
    setOnline(true);
  };

  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);
  return () => {
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  };
}
