import { use, type Context } from 'react';
import { maybeFunction, type MaybeFunction } from '@wener/utils';
import { useStore, type ExtractState, type StoreApi } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export const createBoundedUseStore = ((store) => (selector) => {
	const _store = isContext(store) ? use(store) : maybeFunction(store);
	if (!_store) {
		throw new Error('No store');
	}
	const shallowSelector = selector ? useShallow(selector) : selector;
	return useStore(_store as any, shallowSelector);
}) as <S extends StoreApi<unknown>>(store: MaybeFunction<S> | Context<undefined | null | S>) => BoundedUseStore<S>;

export type BoundedUseStore<S extends StoreApi<unknown>> = {
	(): ExtractState<S>;
	<T = any>(selector: (state: ExtractState<S>) => T): T;
};

function isContext<T>(v: unknown | Context<T>): v is Context<T> {
	return (
		typeof v === 'object' &&
		v !== null &&
		'$$typeof' in v &&
		typeof (v as { Provider?: unknown }).Provider !== 'undefined'
	);
}
