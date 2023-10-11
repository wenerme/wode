import type { FloatingContext } from '@floating-ui/react';
import { useClick, useDismiss, useFocus, useHover, useInteractions, useRole } from '@floating-ui/react';

export interface UseFloatingInteractionsOptions {
  focus?: boolean | Parameters<typeof useFocus>[1];
  click?: boolean | Parameters<typeof useClick>[1];
  dismiss?: boolean | Parameters<typeof useDismiss>[1];
  hover?: boolean | Parameters<typeof useHover>[1];
  role?: 'tooltip' | 'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'grid' | 'tree';
}

export function useFloatingInteractions(
  context: FloatingContext,
  { click = true, dismiss = true, hover = false, focus = false, role }: UseFloatingInteractionsOptions,
) {
  return useInteractions([
    useHover(context, typeof hover === 'boolean' ? { enabled: hover } : hover),
    useFocus(context, typeof focus === 'boolean' ? { enabled: focus } : focus),
    useClick(context, typeof click === 'boolean' ? { enabled: click } : click),
    useRole(context, {
      role: role || 'dialog',
    }),
    useDismiss(context, typeof dismiss === 'boolean' ? { enabled: dismiss } : dismiss),
  ]);
}
