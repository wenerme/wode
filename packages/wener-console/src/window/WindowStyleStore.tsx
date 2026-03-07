import { getGlobalStates } from '@wener/utils';
import type { ComponentType } from 'react';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';
import { WindowFrame, type WindowFrameProps } from './WindowFrame';

export interface WindowStyleState {
	theme?: 'macos' | 'windows' | 'system';
	components: {
		WindowFrame: ComponentType<WindowFrameProps>;
	};
}

export function getWindowStyleStore(): WindowStyleStore {
	return getGlobalStates('WindowStyleStore', createWindowStyleStore);
}

export function createWindowStyleStore() {
	return createStore(
		mutative<WindowStyleState>(() => {
			return {
				theme: 'system',
				components: {
					WindowFrame: WindowFrame,
				},
			};
		}),
	);
}

export type WindowStyleStore = ReturnType<typeof createWindowStyleStore>;
