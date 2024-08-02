import React, { forwardRef } from 'react';
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentProps,
  OverlayScrollbarsComponentRef,
} from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

export const OverlayScrollbar = forwardRef<OverlayScrollbarsComponentRef<'div'>, OverlayScrollbarsComponentProps>(
  ({ children, ...props }, ref) => {
    return (
      <OverlayScrollbarsComponent
        defer
        options={{
          scrollbars: {
            visibility: 'auto',
            autoHide: 'leave',
            autoHideDelay: 1000,
            autoHideSuspend: true,
          },
        }}
        ref={ref}
        {...props}
      >
        {children}
      </OverlayScrollbarsComponent>
    );
  },
);
OverlayScrollbar.displayName = 'OverlayScrollbar';
