import { proxyWithCompare } from '@wener/reaction/valtio';
import { getGlobalStates } from '@wener/utils';
import Emittery from 'emittery';
import { useSnapshot } from 'valtio';
import type { AssistantTool } from './types';
import { WodeAssistantSidecar } from './sidecar/WodeAssistantSidecar';

export const AssistantLauncherEventType = {
	OpenWindow: 'AssistantLauncher:OpenWindow',
};
export type AssistantLauncherEventType = '';

type AssistantLauncherEventData = {
	[AssistantLauncherEventType.OpenWindow]: {};
};
export type AssistantLauncherEmitter = Emittery<AssistantLauncherEventData>;

type AssistantLauncherState = {
	// UI State
	activeToolId?: string;
	searchQuery: string;
	tools: AssistantTool[];

	user: {
		username: string;
		displayName: string;
	};
	info: {
		title: string;
		version: string;
	};

	// Sidecar
	sidecar: WodeAssistantSidecar;
};

export function createAssistantLauncherState(): AssistantLauncherState {
	return {
		activeToolId: undefined,
		searchQuery: '',
		tools: [],
		user: {
			username: 'guest',
			displayName: 'Guest',
		},
		info: {
			title: 'Assistant',
			version: '1.0.0',
		},
		sidecar: new WodeAssistantSidecar(),
	};
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
