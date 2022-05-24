import classNames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const ActiveLink: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    active?: string | ((v: boolean) => string);
  }
> = ({ href, children, active, className, ...props }) => {
  let router = useRouter();

  let [activeClassName, set] = useState('');
  // prevent server render different from client
  useEffect(() => {
    let isActive = router.asPath === href;
    if (active instanceof Function) {
      set(active(isActive));
    } else if (isActive) {
      set(active || 'active');
    }
  }, [router.asPath]);

  return (
    <Link href={href}>
      <a className={classNames(className, activeClassName)} {...props}>
        {children}
      </a>
    </Link>
  );
};

export const MaybeLink: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { as?: React.ElementType; active?: string | ((v: boolean) => string) }
> = ({ href, children, as: Alt = 'a', className, ...props }) => {
  return href ? (
    <ActiveLink href={href} className={className} {...props}>
      {children}
    </ActiveLink>
  ) : (
    <Alt className={classNames('cursor-default', className)} {...props}>
      {children}
    </Alt>
  );
};
