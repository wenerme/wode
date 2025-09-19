import { useEffect, useRef } from 'react';

/**
 * usePrevious will return previous value without state change
 */
export function usePrevious<T>(value: T) {
	const ref = useRef<T>(undefined);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref.current;
}
