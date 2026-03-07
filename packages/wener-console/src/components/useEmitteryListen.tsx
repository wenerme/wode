import type Emittery from 'emittery';
import { useEffect, useRef } from 'react';

export function useEmitteryListen<E>(
	e: Emittery<E>,
	handle: NoInfer<{
		[K in keyof E]?: (data: E[K]) => void;
	}>,
) {
	const ref = useRef<any>(handle);
	ref.current = handle;
	useEffect(() => {
		let unsub = Object.keys(ref.current).map((event) => {
			return e.on(event as any, (e) => {
				return ref.current[event]?.(e);
			});
		});
		return () => {
			unsub.forEach((x) => x());
		};
	}, [e, ...Object.keys(handle).sort()]);
}
