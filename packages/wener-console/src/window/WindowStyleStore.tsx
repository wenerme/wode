import { getGlobalStates } from '@wener/utils';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';

export interface WindowStyleState {
  theme?: 'macos' | 'windows' | 'system';
}

export function getWindowStyleStore(): WindowStyleStore {
  return getGlobalStates('WindowStyleStore', createWindowStyleStore);
}

export function createWindowStyleStore() {
  return createStore(
    mutative<WindowStyleState>(() => {
      return {
        theme: 'system',
      };
    }),
  );
}

export type WindowStyleStore = ReturnType<typeof createWindowStyleStore>;
