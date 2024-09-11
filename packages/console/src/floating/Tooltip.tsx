import { cloneElement, Fragment, type CSSProperties, type ReactNode } from 'react';
import { FloatingPortal, Placement } from '@floating-ui/react';
import { UseFloatingInteractionsOptions } from '@wener/console/floating';
import { cn } from '../tw/cn';
import { usePopover } from './usePopover';

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
  // click = false,
  // dismiss = true,
  // hover = true,
  // focus = false,
  // role = 'tooltip',
  placement = 'top',
  className,
  // style,
  ...props
}: TooltipProps) => {
  // not works in SSR
  if (typeof window === 'undefined') return children;

  const { refs, getReferenceProps, getFloatingProps, floatingStyles, open, context } = usePopover({
    hover: true,
    placement,
  });

  if (!content) return children;

  let trigger = cloneElement(
    children,
    getReferenceProps({ ref: refs.setReference, ...children.props, ...getReferenceProps() }),
  );
  let Wrapper = portal ? FloatingPortal : Fragment;
  return (
    <>
      {trigger}
      {open && (
        <Wrapper>
          <div
            role={'tooltip'}
            className={cn('Tooltip max-w-xs rounded bg-neutral px-2 py-1 text-sm text-neutral-content', className)}
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={floatingStyles}
          >
            {content}
          </div>
        </Wrapper>
      )}
    </>
  );
};
