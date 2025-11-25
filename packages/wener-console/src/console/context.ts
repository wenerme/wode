import { getGlobalStates, setGlobalStates } from '@wener/utils';
import type Emittery from 'emittery';
import { useStore } from 'zustand';
import { getSiteStore as _getSiteStore, type SiteStore } from '../foundation/site/SiteStore';
import type { ConsoleEmitter, ConsoleEventData } from './ConsoleEmitter';
import { ConsoleEventType } from './ConsoleEmitter';
import { createRouteStore, type RouteStore } from './store/RouteStore';
import { createUserStore, type UserStore } from './store/UserStore';

// IoC, DI is not the goal, just need a global context

export type ConsoleContext = {
	getAccessToken: () => string | undefined;
	useUserId: () => string | undefined;
	getEmitter: () => ConsoleEmitter;
	getRouteStore: () => RouteStore;
	getSiteStore: () => SiteStore;
	getUserStore: () => UserStore;
};

export { ConsoleEventType };

function createConsoleContext({ emitter: _emitter }: { emitter?: Emittery }) {
	const emitter = getConsoleEmitter();
	const routeStore = createRouteStore();
	const userStore = createUserStore();
	const ctx: ConsoleContext = {
		getAccessToken: () => undefined,
		getEmitter: () => emitter,
		getRouteStore: () => routeStore,
		getSiteStore: _getSiteStore,
		getUserStore: () => userStore,
		useUserId: () => useStore(getUserStore(), (s) => s.id),
	};
	return {
		emitter,
		context: ctx,
	};
}

const ConsoleContextKey = 'ConsoleContext';

export function getConsoleContext(): ConsoleContext {
	return getGlobalStates(ConsoleContextKey, () => {
		return createConsoleContext({}).context;
	});
}

export function setConsoleContext(context: ConsoleContext) {
	setGlobalStates(ConsoleContextKey, context);
}

export function getAccessToken() {
	return getConsoleContext().getAccessToken();
}

export function useUserId() {
	return getConsoleContext().useUserId();
}

export function getRouteStore(): RouteStore {
	return getConsoleContext().getRouteStore();
}

export function getSiteStore(): SiteStore {
	return getConsoleContext().getSiteStore();
}

export function getUserStore(): UserStore {
	return getConsoleContext().getUserStore();
}

export function getConsoleEmitter(): ConsoleEmitter {
	return getConsoleContext().getEmitter();
}
