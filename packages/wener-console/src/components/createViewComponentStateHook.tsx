import { useCallback } from 'react';
import type { Selector } from '@wener/reaction';
import { maybeFunction, type MaybeFunction } from '@wener/utils';
import type { Draft } from 'mutative';
import { useStore, type StoreApi } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { HasComponentsState } from './ComponentsState';
import type { SetState } from './types';

type DraftUpdater<T> = (update: Partial<T> | ((state: Draft<T>) => void)) => void;
type DraftStore<T> = Omit<StoreApi<T>, 'setState'> & {
	setState: DraftUpdater<T>;
};
type UseViewComponentState = <T, R>(name: string, selector?: Selector<T, R>) => [R, SetState<T>];

export function createViewComponentStateHook<S extends DraftStore<HasComponentsState>>(
	store: MaybeFunction<S>,
): UseViewComponentState {
	return <T, R>(name: string, selector?: Selector<T, R>) => {
		const currentStore = maybeFunction(store);
		const state = useStore(
			currentStore,
			useShallow((s) => (selector ? selector((s.components[name] || {}) as T) : s.components[name] || {})),
		) as R;

		return [
			state,
			useCallback(
				(action) => {
					currentStore.setState((s) => {
						const prevState = (s.components[name] || {}) as any;
						const nextState = typeof action === 'function' ? (action(prevState) ?? prevState) : action;
						s.components[name] = nextState;
					});
				},
				[currentStore, name],
			),
		];
	};
}
