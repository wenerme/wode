import { getGlobalStates, setGlobalStates } from '@wener/utils';
import { ConsoleEventType, getConsoleEmitter } from '../console/ConsoleEmitter';

export function getBaseUrl() {
	return getGlobalStates('SiteBaseUrl', () => {
		return globalThis.location?.origin || 'http://localhost';
	});
}

export function setBaseUrl(baseUrl: string) {
	setGlobalStates('SiteBaseUrl', baseUrl);
	getConsoleEmitter().emit(ConsoleEventType.BaseUrlChanged, {
		baseUrl,
	});
	console.log(`setBaseUrl: ${baseUrl}`);
}
