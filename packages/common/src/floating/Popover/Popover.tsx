import type { CSSProperties } from 'react';
import React, { cloneElement, useMemo } from 'react';
import classNames from 'classnames';
import { autoUpdate } from '@floating-ui/dom';
import type { Placement } from '@floating-ui/react';
import { flip, FloatingFocusManager, FloatingPortal, offset, shift, useFloating, useId } from '@floating-ui/react';
import type { FlexRenderable } from '@wener/reaction';
import { flexRender, mergeRefs, useControllable } from '@wener/reaction';
import type { UseFloatingInteractionsOptions } from '../useFloatingInteractions';
import { useFloatingInteractions } from '../useFloatingInteractions';

export interface PopoverProps extends UseFloatingInteractionsOptions {
  placement?: Placement;
  children: JSX.Element;

  modal?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  content?: FlexRenderable<PopoverContentProps>;

  offset?: number;
  shift?: Parameters<typeof shift>[0];

  portal?: boolean;
  className?: string;
  style?: CSSProperties;
}

export interface PopoverContentProps {
  close: () => void;
  labelId: string;
  descriptionId: string;
}

export const Popover = ({
  children,
  placement,
  content,
  portal,
  className,
  style,
  click = true,
  dismiss = true,
  hover = false,
  role = 'dialog',
  focus,
  modal,
  offset: _offset = 5,
  shift: _shift,
  ...props
}: PopoverProps) => {
  const [open, setOpen] = useControllable(props.open, props.onOpenChange, false);

  const { x, y, reference, floating, strategy, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [offset(_offset), flip(), shift(_shift)],
    placement,
    whileElementsMounted: autoUpdate,
  });

  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const { getReferenceProps, getFloatingProps } = useFloatingInteractions(context, {
    click,
    dismiss,
    hover,
    focus,
    role,
  });

  // Preserve the consumer's ref
  const ref = useMemo(() => mergeRefs(reference, (children as any).ref), [reference, children]);

  const pop = open && (
    <FloatingFocusManager context={context} modal={modal} order={['reference', 'content']} returnFocus={true}>
      <div
        ref={floating}
        className={classNames('Popover', className)}
        style={{
          ...style,
          position: strategy,
          top: y ?? 0,
          left: x ?? 0,
        }}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        {...getFloatingProps()}
      >
        {!open
          ? null
          : flexRender(content, {
              close: () => {
                setOpen(false);
              },
              labelId,
              descriptionId,
            })}
      </div>
    </FloatingFocusManager>
  );
  return (
    <>
      {cloneElement(children, getReferenceProps({ ref, ...children.props }))}
      {open && !portal && pop}
      <FloatingPortal>{open && portal && pop}</FloatingPortal>
    </>
  );
};
