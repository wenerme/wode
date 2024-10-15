import React from 'react';
import { BiLinkExternal } from 'react-icons/bi';
import { clsx } from 'clsx';

export const FootNoteLink: React.FC<
  React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
> = ({ className, children, ...props }) => {
  return (
    <a
      {...props}
      className={clsx(className, 'inline-flex items-center px-1 text-info-content hover:underline')}
      target='_blank'
      rel='noopener noreferrer'
    >
      {children}
      <BiLinkExternal />
    </a>
  );
};
