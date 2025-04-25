import { useRef } from 'react';

export function useEqual<S, U>(
	selector: (state: S) => U,
	equal: (a: NoInfer<U> | undefined, b: NoInfer<U>) => boolean,
): (state: S) => U {
	// https://github.com/pmndrs/zustand/blob/main/src/react/shallow.ts
	const prev = useRef<U>(undefined);
	return (state) => {
		const next = selector(state);
		return equal(prev.current, next) ? (prev.current as U) : (prev.current = next);
	};
}
