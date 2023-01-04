import React from 'react';
import { BiLinkExternal } from 'react-icons/bi';
import classNames from 'classnames';

export const ExternalLink: React.FC<
  React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
> = ({ className, children, ...props }) => {
  return (
    <a
      {...props}
      className={classNames(className, 'inline-flex items-center px-1 text-info-content hover:underline')}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <BiLinkExternal />
    </a>
  );
};
