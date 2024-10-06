import type { CSSProperties } from 'react';
import type React from 'react';
import { cloneElement, isValidElement, useMemo, useState } from 'react';
import { autoUpdate } from '@floating-ui/dom';
import type { Placement } from '@floating-ui/react';
import {
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useId,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import type { FlexRenderable } from '@wener/reaction';
import { flexRender, mergeRefs, useControllable } from '@wener/reaction';
import { clsx } from 'clsx';
import type { UseFloatingInteractionsOptions } from './useFloatingInteractions';
import { useFloatingInteractions } from './useFloatingInteractions';

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

  const { x, y, refs, strategy, context } = useFloating({
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
  const ref = useMemo(() => mergeRefs(refs.setReference, (children as any).ref), [refs.setReference, children]);

  const pop = open && (
    <FloatingFocusManager context={context} modal={modal} order={['reference', 'content']} returnFocus={true}>
      <div
        ref={refs.setFloating}
        className={clsx('Popover', className)}
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

interface Props {
  render: (data: { close: () => void; labelId: string; descriptionId: string }) => React.ReactNode;
  placement?: Placement;
  modal?: boolean;
  children?: React.ReactElement<HTMLElement>;
  bubbles?: boolean;
}

function PopoverComponent({ children, render, placement, modal = true, bubbles = true }: Props) {
  const [open, setOpen] = useState(false);

  const nodeId = useFloatingNodeId();
  const { floatingStyles, refs, context } = useFloating({
    nodeId,
    open,
    placement,
    onOpenChange: setOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useRole(context),
    useDismiss(context, {
      bubbles,
    }),
  ]);

  return (
    <FloatingNode id={nodeId}>
      {isValidElement(children) &&
        cloneElement(
          children,
          getReferenceProps({
            ref: refs.setReference,
            'data-open': open ? '' : undefined,
          } as React.HTMLProps<Element>),
        )}
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} modal={modal}>
            <div
              className='rounded border border-slate-900/10 bg-white bg-clip-padding px-4 py-6 shadow-md'
              ref={refs.setFloating}
              style={floatingStyles}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...getFloatingProps()}
            >
              {render({
                labelId,
                descriptionId,
                close: () => setOpen(false),
              })}
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </FloatingNode>
  );
}

/*
export function Popover(props: Props) {
  const parentId = useFloatingParentNodeId();

  // This is a root, so we wrap it with the tree
  if (parentId === null) {
    return (
      <FloatingTree>
        <PopoverComponent {...props} />
      </FloatingTree>
    );
  }

  return <PopoverComponent {...props} />;
}
 */
