import { mutative } from '@wener/reaction/mutative/zustand';
import { computeIfAbsent } from '@wener/utils';
import { createStore } from 'zustand';
import { getGlobalStates } from '../../state';

export interface WindowStyleState {
  theme?: 'macos' | 'windows' | 'system';
}

export function getWindowStyleStore(): WindowStyleStore {
  return computeIfAbsent(getGlobalStates(), 'WindowStyleStore', createWindowStyleStore);
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
