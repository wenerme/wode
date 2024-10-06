import { createEventListenerHook } from './useEventListener';

/**
 * useDocumentEventListener listen on {@link window}
 */
export const useWindowEventListener = createEventListenerHook<
  WindowEventHandlersEventMap & GlobalEventHandlersEventMap
>(typeof window === 'undefined' ? undefined : window);
/**
 * useDocumentEventListener listen on {@link document}
 */
export const useDocumentEventListener = createEventListenerHook<DocumentEventMap>(
  typeof document === 'undefined' ? undefined : document,
);
/**
 * useBodyEventListener listen on {@link document.body}
 */
export const useBodyEventListener = createEventListenerHook<HTMLBodyElementEventMap>(
  typeof document === 'undefined' ? undefined : document.body,
);
