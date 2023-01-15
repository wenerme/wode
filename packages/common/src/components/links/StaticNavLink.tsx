import React, { forwardRef, useEffect, useRef, useState } from 'react';
import type { AutoNavLinkProps } from './AutoNavLink';

/**
 *  不会添加 basename
 */
export const StaticNavLink = forwardRef<HTMLAnchorElement, AutoNavLinkProps>(
  ({ href, children, className, ...rest }, ref) => {
    const [isActive, setActive] = useState(() =>
      new URL(globalThis.location?.href || 'http://127.0.0.1:3000').pathname.startsWith(href),
    );
    const onUrl = (s: string) => {
      new URL(s).pathname.startsWith(href) ? setActive(true) : setActive(false);
    };
    const cbRef = useRef<(s: string) => void>(onUrl);
    cbRef.current = onUrl;
    useEffect(() => {
      const navigation = (globalThis as any).navigation as EventTarget;
      const callback = (e: any) => {
        cbRef.current(e.destination.url as string);
      };
      navigation?.addEventListener('navigate', callback);
      return () => {
        navigation?.removeEventListener('navigate', callback);
      };
    }, []);
    return (
      <a
        href={href}
        ref={ref}
        className={typeof className === 'function' ? className({ isActive }) : className}
        {...rest}
      >
        {typeof children === 'function' ? children({ isActive }) : children}
      </a>
    );
  },
);

StaticNavLink.displayName = 'StaticNavLink';
