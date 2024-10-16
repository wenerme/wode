import type { MaybePromise } from '@wener/utils';
import { getConsoleContext } from '../container';

export function getUserAction(): UserAction {
  return getConsoleContext().userAction;
}

export interface UserAction {
  refreshProfile: () => MaybePromise<void>;
  signIn: () => MaybePromise<void>;
  signOut: () => MaybePromise<void>;
  lock: () => MaybePromise<void>;
  unlock: (options?: { pin?: string }) => MaybePromise<void>;
}
