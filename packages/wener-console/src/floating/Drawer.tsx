import React, { cloneElement, isValidElement, useEffect, useId, useState, type ReactNode } from 'react';
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';

interface Props {
  render: (data: { close: () => void; labelId: string; descriptionId: string }) => ReactNode;
  children?: ReactNode;
}

function useMediaQuery({ query }: { query: string }) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const listener = () => setMatches(mediaQuery.matches);
    listener();
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function Drawer({ children, render }: Props) {
  const [open, setOpen] = useState(false);

  const isLargeScreen = useMediaQuery({ query: '(min-width: 1400px)' });
  const { refs, context } = useFloating({ open, onOpenChange: setOpen });

  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const modal = !isLargeScreen;

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useRole(context),
    useDismiss(context, {
      outsidePress: modal,
      outsidePressEvent: 'mousedown',
    }),
  ]);

  const content = (
    <FloatingFocusManager context={context} modal={modal} closeOnFocusOut={modal}>
      <div
        ref={refs.setFloating}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className='absolute right-0 top-0 h-full w-48 bg-slate-100 p-4'
        {...getFloatingProps()}
      >
        {render({
          labelId,
          descriptionId,
          close: () => setOpen(false),
        })}
      </div>
    </FloatingFocusManager>
  );

  return (
    <>
      {isValidElement(children) && cloneElement(children, getReferenceProps({ ref: refs.setReference }))}
      {/* eslint-disable-next-line react/jsx-no-undef */}
      <FloatingPortal id='drawer-root'>
        {open &&
          (modal ? (
            <FloatingOverlay lockScroll style={{ background: 'rgba(0, 0, 0, 0.8)', zIndex: 1 }}>
              {content}
            </FloatingOverlay>
          ) : (
            content
          ))}
      </FloatingPortal>
    </>
  );
}
