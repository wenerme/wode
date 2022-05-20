import { DependencyList, useEffect } from 'react';

export type HandlersOfEventMap<T extends object> = {
  [k in keyof T]?: (e: T[k]) => void;
};

/**
 * useEventListener listen on {@link EventTarget}
 */
export function useEventListener<E extends object = HTMLElementEventMap>(
  target: EventTarget | undefined,
  handlers: HandlersOfEventMap<E>,
  deps: DependencyList,
) {
  useEffect(() => {
    if (!target) {
      return;
    }
    const all = Object.entries(handlers);
    all.map(([n, h]) => target.addEventListener(n, h as any));
    return () => {
      all.map(([n, h]) => target.removeEventListener(n, h as any));
    };
  }, deps);
}

/**
 * createEventListenerHook a {@link useEventListener} hook with predefined {@link EventTarget}
 */
export function createEventListenerHook<E extends object = HTMLElementEventMap>(target: EventTarget | undefined) {
  return (handlers: HandlersOfEventMap<E>, deps: DependencyList) => useEventListener(target, handlers, deps);
}
