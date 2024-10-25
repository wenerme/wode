import React, { forwardRef, useEffect, useState, type ReactElement } from 'react';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { useRouter } from 'next/router';

export interface NextNavLinkProps extends LinkProps {
  children: ReactElement | ((o: { isActive: boolean }) => ReactElement);
  className?: string | ((o: { isActive: boolean }) => string);
}

export const NextNavLink = /* @__PURE__ */ forwardRef<HTMLAnchorElement, NextNavLinkProps>(
  ({ children, className, ...props }, ref) => {
    const { asPath, isReady } = useRouter();
    const [isActive, setActive] = useState(false);

    useEffect(() => {
      if (isReady) {
        const linkPathname = new URL((props.as || props.href) as string, location.href).pathname;
        const activePathname = new URL(asPath, location.href).pathname;

        setActive(linkPathname === activePathname);
      }
    }, [asPath, isReady, props.as, props.href]);

    return (
      <Link {...props} legacyBehavior ref={ref}>
        <a className={typeof className === 'function' ? className({ isActive }) : className}>
          {typeof children === 'function' ? children({ isActive }) : children}
        </a>
      </Link>
    );
  },
);
