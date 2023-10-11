import React, { cloneElement, type CSSProperties, type ReactNode, type Ref, useMemo } from 'react';
import { autoUpdate } from '@floating-ui/dom';
import type { Placement } from '@floating-ui/react';
import { flip, FloatingPortal, offset, shift, useFloating } from '@floating-ui/react';
import { mergeRefs, useControllable } from '@wener/reaction';
import classNames from 'clsx';
import type { UseFloatingInteractionsOptions } from '../useFloatingInteractions';
import { useFloatingInteractions } from '../useFloatingInteractions';

export interface TooltipProps extends UseFloatingInteractionsOptions {
  content?: ReactNode;
  placement?: Placement;
  children: JSX.Element;
  portal?: boolean;
  className?: string;
  style?: CSSProperties;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export const Tooltip = ({
  children,
  content,
  portal,
  click = false,
  dismiss = true,
  hover = true,
  focus = false,
  role = 'tooltip',
  placement = 'top',
  className,
  style,
  ...props
}: TooltipProps) => {
  // not works in SSR
  if (typeof window === 'undefined') return null;

  const [open, setOpen] = useControllable(props.open, props.onOpenChange, false);

  const { x, y, refs, strategy, context } = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    middleware: [offset(5), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const { reference, floating } = refs;

  const { getReferenceProps, getFloatingProps } = useFloatingInteractions(context, {
    role,
    click,
    hover,
    dismiss,
    focus,
  });

  // Preserve the consumer's ref
  const ref = useMemo(() => mergeRefs(reference, (children as any)?.ref), [reference, children]);

  if (!content || !children) {
    return children;
  }

  const tip = open && (
    <>
      <div
        ref={floating as Ref<HTMLDivElement>}
        className={classNames('Tooltip max-w-xs rounded bg-neutral px-2 py-1 text-sm text-neutral-content', className)}
        style={{
          ...style,
          position: strategy,
          top: y ?? 0,
          left: x ?? 0,
        }}
        {...getFloatingProps()}
      >
        {content}
      </div>
    </>
  );

  return (
    <>
      {cloneElement(children, getReferenceProps({ ref, ...children.props }))}
      {open && !portal && tip}
      <FloatingPortal>{open && portal && tip}</FloatingPortal>
    </>
  );
};
