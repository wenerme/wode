import { useEffect, useRef, type DependencyList } from 'react';

/**
 * useAsyncEffect accept async function call, which can accept an AbortController and return a Promise
 * @param effect Effect function
 * @param deps DependencyList
 */
export function useAsyncEffect(
	effect: (o: { signal: AbortSignal }) => Promise<void | undefined | (() => void)>,
	deps?: DependencyList,
): { abort: () => void } {
	const abortRef = useRef<() => void>(undefined);
	useEffect(() => {
		const abortController = new AbortController();
		abortRef.current = () => abortController.abort();
		let cleanup: undefined | (() => void);
		effect({ signal: abortController.signal })
			.then((rs) => {
				if (typeof rs === 'function') {
					cleanup = rs;
				}
			})
			.catch((e) => {
				console.trace(`uncaught useAsyncEffect error`, deps, e);
			});
		return () => {
			cleanup?.();
			abortController.abort();
		};
	}, deps);
	return { abort: abortRef.current ?? (() => undefined) };
}
