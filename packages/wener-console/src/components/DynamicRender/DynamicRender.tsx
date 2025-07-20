import React, { Fragment, use, useCallback, useState, type PropsWithChildren, type ReactNode } from 'react';
import { createReactContext, FlexRenderer } from '@wener/reaction';
import { getGlobalStates } from '@wener/utils';
import { createStore, useStore } from 'zustand';
import { mutative } from 'zustand-mutative';
import { useShallow } from 'zustand/react/shallow';

type DynamicRenderStoreState = {
	items: Array<{
		id: string;
		content: ReactNode;
		handle: DynamicRenderHandle;
	}>;

	actions: {
		render(options: DynamicRenderOptions): DynamicRenderHandle;
		remove(id: string): void;
	};
};
type DynamicRenderStore = ReturnType<typeof createDynamicRenderStore>;

function createDynamicRenderStore() {
	return createStore(
		mutative<DynamicRenderStoreState>((setState, getState, store) => {
			const remove = (id: string) => {
				setState((s) => {
					s.items = s.items.filter((v) => v.id !== id);
				});
			};
			return {
				items: [],

				actions: {
					remove,
					render: (options) => {
						let { id, render, content } = options;
						id ||= `render-${Math.random().toString(16).slice(2)}`;

						let handle = {
							id,
							remove: () => {
								remove(id);
							},
						};
						if (render) {
							content = (
								<FlexRenderer
									render={() => {
										return render();
									}}
								/>
							);
						}
						store.setState((s) => {
							let item = s.items.find((v) => v.id === id);
							if (!item) {
								s.items.push((item = { id, content, handle }));
							}
							item.content = content;
							item.handle = handle;
						});
						return handle;
					},
				},
			};
		}),
	);
}

const RenderStoreContext = createReactContext<DynamicRenderStore | undefined>('RenderStoreContext', undefined);

function getRenderStore() {
	return getGlobalStates('DynamicRenderStore', createDynamicRenderStore);
}

function useRenderStore(): DynamicRenderStore {
	return use(RenderStoreContext) || getRenderStore();
}

export const Outlet = () => {
	const store = useRenderStore();
	const items = useStore(
		store,
		useShallow((s) => s.items),
	);
	return (
		<Fragment>
			{items.map((item) => {
				const { id, handle, content } = item;
				return (
					<RenderHandleContext key={id} value={handle}>
						{content}
					</RenderHandleContext>
				);
			})}
		</Fragment>
	);
};

export const Root = ({ children }: PropsWithChildren) => {
	const [store] = useState(() => createDynamicRenderStore());
	return <RenderStoreContext value={store}>{children}</RenderStoreContext>;
};

const RenderHandleContext = createReactContext<DynamicRenderHandle | undefined>('RenderHandleContext', undefined);

export type DynamicRenderOptions = {
	id?: string;
	render?: () => ReactNode;
	content?: ReactNode;
	renderer?: DynamicRenderer;
};

type DynamicRenderHandle = {
	id: string;
	remove(): void;
};

export type DynamicRenderer = {
	render(options: DynamicRenderOptions): DynamicRenderHandle;
};

export function useRenderer(): DynamicRenderer {
	let store = useRenderStore();
	return useStore(
		store,
		useCallback((s) => s.actions, []),
	);
}

export function useRenderHandle(): DynamicRenderHandle {
	let handle = use(RenderHandleContext);
	if (!handle) {
		throw new Error('RenderHandleContext not found');
	}
	return handle;
}

export function render({ renderer, ...options }: DynamicRenderOptions): DynamicRenderHandle {
	const { render } = renderer || getRenderStore().getState().actions;
	return render(options);
}
