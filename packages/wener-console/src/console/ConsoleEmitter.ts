import { getGlobalStates } from '@wener/utils';
import Emittery from 'emittery';

export const ConsoleEventType = {
	Error: 'Console:Error',
	SignIn: 'Console:SignIn',
	SignOut: 'Console:SignOut',
	Lock: 'Console:Lock',
	Unlock: 'Console:Unlock',
	RefreshProfile: 'Console:RefreshProfile',
	ModuleLoad: 'Console:Module:Load',
	LauncherToggle: 'Console:Launcher:Toggle',
	BaseUrlChanged: 'Console:BaseUrlChanged',
} as const;

type ConsoleEvent<T> = T;

export type ConsoleEventData = {
	[ConsoleEventType.Error]: ConsoleEvent<{ error: any }>;
	[ConsoleEventType.SignIn]: ConsoleEvent<{}>;
	[ConsoleEventType.SignOut]: ConsoleEvent<{}>;
	[ConsoleEventType.Lock]: ConsoleEvent<{}>;
	[ConsoleEventType.Unlock]: ConsoleEvent<{ pin?: string }>;
	[ConsoleEventType.RefreshProfile]: ConsoleEvent<{}>;
	[ConsoleEventType.ModuleLoad]: ConsoleEvent<{ module: any }>;
	[ConsoleEventType.LauncherToggle]: ConsoleEvent<{ open?: boolean }>;
	[ConsoleEventType.BaseUrlChanged]: ConsoleEvent<{
		baseUrl: string;
	}>;
};

export type ConsoleEmitter = Emittery<ConsoleEventData>;

export function getConsoleEmitter(): ConsoleEmitter {
	return getGlobalStates('ConsoleEmitter', () => {
		return new Emittery<ConsoleEventData>({
			debug: {
				name: 'ConsoleEmitter',
			},
		});
	});
}
