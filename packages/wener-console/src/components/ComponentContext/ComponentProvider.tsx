import { use, useEffect, useState, type ComponentType, type ReactNode } from 'react';
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

const ComponentContext = createReactContext<ComponentStore | undefined>('ComponentContext', undefined);

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
		mutative<ComponentStoreState>((_setState, getState, _store) => {
			return {
				provides: [],
				...init,
				actions: {
					find(provide: string | ComponentType) {
						const { provides } = getState();
						const p = provides.find((p) => p.provide === provide);
						if (p) {
							return p.use;
						}
						return undefined;
					},
				},
			};
		}),
	);
}

export function useComponentStore(): ComponentStore {
	const value = use(ComponentContext);
	return value || getGlobalStates('ComponentStore', () => createComponentStore());
}

export const ComponentProvider = ({ children, provides }: ComponentProviderProps) => {
	let _parent = useComponentStore();
	const [store] = useState(() => createComponentStore({ provides }));
	useEffect(() => {}, provides);

	return <ComponentContext value={store}>{children}</ComponentContext>;
};
