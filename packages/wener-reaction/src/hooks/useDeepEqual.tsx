import { deepEqual } from '@wener/utils';
import { useRef } from 'react';

export function useDeepEqual<S, U>(selector: (state: S) => U): (state: S) => U {
	// https://github.com/pmndrs/zustand/blob/main/src/react/shallow.ts
	const prev = useRef<U>(undefined);
	return (state) => {
		const next = selector(state);
		return deepEqual(prev.current, next) ? (prev.current as U) : (prev.current = next);
	};
}
