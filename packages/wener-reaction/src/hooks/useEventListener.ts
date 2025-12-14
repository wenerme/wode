import { useEffect, useRef } from 'react';

export type HandlersOfEventMap<T extends object> = { [k in keyof T]?: (e: T[k]) => void };

/**
 * useEventListener listen on {@link EventTarget}
 */
export function useEventListener<E extends object = HTMLElementEventMap>(
	target: EventTarget | null | undefined,
	handlers: HandlersOfEventMap<E>,
) {
	const handlersRef = useRef(handlers);
	handlersRef.current = handlers;

	const keys = Object.keys(handlers);
	useEffect(() => {
		if (!target) return;

		const wrappers = keys.map((name) => {
			const wrapper = (e: Event) => handlersRef.current[name as keyof E]?.(e as any);
			target.addEventListener(name, wrapper);
			return { name, wrapper };
		});
		return () => {
			wrappers.forEach(({ name, wrapper }) => {
				target.removeEventListener(name, wrapper);
			});
		};
	}, [target, ...keys]);
}

/**
 * createEventListenerHook a {@link useEventListener} hook with predefined {@link EventTarget}
 */
export function createEventListenerHook<E extends object = HTMLElementEventMap>(target: EventTarget | undefined) {
	return (handlers: HandlersOfEventMap<E>) => useEventListener(target, handlers);
}
