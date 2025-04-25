import { deepEqual, shallowEqual } from '@wener/utils';
import { useEqual } from './useEqual';

export function useDeepEqual<S, U>(selector: (state: S) => U): (state: S) => U {
	return useEqual(selector, deepEqual);
}

export function useShallowEqual<S, U>(selector: (state: S) => U): (state: S) => U {
	return useEqual(selector, shallowEqual);
}
