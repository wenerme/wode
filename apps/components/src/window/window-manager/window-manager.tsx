'use client';

import { WindowManagerProvider } from './window-manager-context';
import { WindowManagerHost, type WindowManagerHostProps } from './window-manager-host';
import { WindowManagerPersistence, type WindowManagerPersistenceProps } from './window-manager-persistence';
import type { WindowManagerStore } from './window-manager-store';
import type { WindowManagerCreateOptions } from './window-manager-types';

export type WindowManagerRuntimeProps = WindowManagerHostProps & {
	options?: WindowManagerCreateOptions;
	persistence?: false | WindowManagerPersistenceProps;
	store?: WindowManagerStore;
};

export function WindowManagerRuntime({ options, persistence = false, store, ...hostProps }: WindowManagerRuntimeProps) {
	return (
		<WindowManagerProvider options={options} store={store}>
			{persistence ? <WindowManagerPersistence {...persistence} /> : null}
			<WindowManagerHost {...hostProps} />
		</WindowManagerProvider>
	);
}
