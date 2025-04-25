import React, { use, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { createReactContext } from '@wener/reaction';
import { getGlobalStates } from '@wener/utils';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';

type ComponentProvide = {
	provide: string | ComponentType;
	use: ComponentType;
};

type ComponentContextValue = {
	find: (provide: string | ComponentType) => ComponentType | undefined;
};

const ComponentContext = createReactContext<ComponentContextValue>('ComponentContext', {
	find: (provide) => {
		if (typeof provide === 'function') {
			return provide;
		}
		return undefined;
	},
});

type ComponentProviderProps = {
	provides: ComponentProvide[];
	children?: ReactNode;
};

type ComponentStoreState = {
	provides: ComponentProvide[];
	actions: {};
};

type ComponentStore = ReturnType<typeof createComponentStore>;

function createComponentStore(init: { provides?: ComponentProvide[] } = {}) {
	return createStore(
		mutative<ComponentStoreState>(() => {
			return {
				provides: [],
				...init,
				actions: {},
			};
		}),
	);
}

export function useComponentStore(): ComponentStore {
	const store = use(ComponentContext);
	return store || getGlobalStates('ComponentStore', () => createComponentStore());
}

export const ComponentProvider = ({ children, provides }: ComponentProviderProps) => {
	let parent = useComponentStore();
	const [store] = useState(() => createComponentStore({ provides }));
	useEffect(() => {}, provides);

	return <ComponentContext value={store}>{children}</ComponentContext>;
};
