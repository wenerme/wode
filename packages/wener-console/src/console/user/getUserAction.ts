import type { MaybePromise } from '@wener/utils';
import { ConsoleEvents, getConsoleContext } from '../context';

export interface UserAction {
  refreshProfile: () => MaybePromise<void>;
  signIn: () => MaybePromise<void>;
  signOut: () => MaybePromise<void>;
  lock: () => MaybePromise<void>;
  unlock: (options?: { pin?: string }) => MaybePromise<void>;
}

export function getUserAction(): UserAction {
  const emitter = getConsoleContext().getEmitter();
  const emit = emitter.emit.bind(emitter);
  return {
    refreshProfile: () => {
      return emit(ConsoleEvents.RefreshProfile, {});
    },
    signIn: () => {
      return emit(ConsoleEvents.SignIn, {});
    },
    signOut: () => {
      return emit(ConsoleEvents.SignOut, {});
    },
    lock: () => {
      return emit(ConsoleEvents.Lock, {});
    },
    unlock: (options?: { pin?: string }) => {
      return emit(ConsoleEvents.Unlock, { ...options });
    },
  };
}
