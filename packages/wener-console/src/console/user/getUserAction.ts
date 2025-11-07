import type { MaybePromise } from '@wener/utils';
import { getConsoleEmitter } from '../ConsoleEmitter';
import { ConsoleEventType } from '../context';

export interface UserAction {
	refreshProfile: () => MaybePromise<void>;
	signIn: () => MaybePromise<void>;
	signOut: () => MaybePromise<void>;
	lock: () => MaybePromise<void>;
	unlock: (options?: { pin?: string }) => MaybePromise<void>;
}

export function getUserAction(): UserAction {
	const emitter = getConsoleEmitter();
	const emit = emitter.emit.bind(emitter);
	return {
		refreshProfile: () => {
			return emit(ConsoleEventType.RefreshProfile, {});
		},
		signIn: () => {
			return emit(ConsoleEventType.SignIn, {});
		},
		signOut: () => {
			return emit(ConsoleEventType.SignOut, {});
		},
		lock: () => {
			return emit(ConsoleEventType.Lock, {});
		},
		unlock: (options?: { pin?: string }) => {
			return emit(ConsoleEventType.Unlock, { ...options });
		},
	};
}
