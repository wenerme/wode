import { computeIfAbsent, getGlobalStates, type MaybeFunction, maybeFunction } from '@wener/utils';
import { cache } from 'react';

let _holder: any = typeof window === 'undefined' ? cache(() => ({})) : getGlobalStates();

export function getContextStates(): Record<string, any>;
export function getContextStates<T>(key: string, create: () => T): T;
export function getContextStates<T>(key: string): T | undefined;
export function getContextStates(key?: string, create?: () => any): any {
	if (key) {
		if (!create) {
			return _holder[key];
		}
		return computeIfAbsent(_holder, key, create);
	}
	return _holder;
}

export const createServerContext = <T>(defaultValue: MaybeFunction<T>): [() => T, (v: T) => void] => {
	const getRef = cache(() => ({ current: maybeFunction(defaultValue) }));
	const getValue = (): T => getRef().current;
	const setValue = (value: T) => {
		getRef().current = value;
	};

	return [getValue, setValue];
};
