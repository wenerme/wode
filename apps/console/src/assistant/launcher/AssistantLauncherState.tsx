import { proxyWithCompare } from '@wener/reaction/valtio';
import { getGlobalStates } from '@wener/utils';
import Emittery from 'emittery';
import { useSnapshot } from 'valtio';

export const AssistantLauncherEventType = {
	OpenWindow: 'AssistantLauncher:OpenWindow',
};
export type AssistantLauncherEventType = '';

type AssistantLauncherEventData = {
	[AssistantLauncherEventType.OpenWindow]: {};
};
export type AssistantLauncherEmitter = Emittery<AssistantLauncherEventData>;

type AssistantLauncherState = {
	user: {
		username: string;
		displayName: string;
	};
	info: {
		title: string;
		version: string;
	};

	system: {
		interfaces: Array<{
			name: string;
			address: string;
		}>;
	};
};

export function createAssistantLauncherState() {
	return {} as AssistantLauncherState;
}

export function getAssistantLauncherState() {
	return getGlobalStates('AssistantLauncherState', () => {
		return proxyWithCompare(createAssistantLauncherState());
	});
}

export function getAssistantLauncherEvents(): AssistantLauncherEmitter {
	return getGlobalStates('AssistantLauncherEvents', () => {
		return new Emittery<AssistantLauncherEventData>({});
	});
}

export function useAssistantLauncherState() {
	return useSnapshot(useAssistantLauncherMutate());
}

export function useAssistantLauncherMutate() {
	return getAssistantLauncherState();
}
