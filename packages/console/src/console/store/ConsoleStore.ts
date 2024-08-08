import { mutative } from '@wener/reaction/mutative/zustand';
import { createStore } from 'zustand';

export interface ConsoleStoreState {
  expired: boolean;
  locked: boolean;

  unlock(options?: { pin?: string }): void;
}

export type ConsoleStore = ReturnType<typeof createConsoleStore>;

export function createConsoleStore() {
  return createStore(
    mutative<ConsoleStoreState>((setState, getState, store) => {
      return {
        expired: false,
        locked: false,
        unlock: (options) => {
          setState((s) => {
            s.locked = false;
          });
        },
      };
    }),
  );
}
