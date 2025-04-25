import type React from 'react';
import { BiLinkExternal } from 'react-icons/bi';
import { clsx } from 'clsx';

export const FootNoteLink: React.FC<
	React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
> = ({ className, children, ...props }) => {
	return (
		<a
			{...props}
			className={clsx(className, 'text-info-content inline-flex items-center px-1 hover:underline')}
			target='_blank'
			rel='noopener noreferrer'
		>
			{children}
			<BiLinkExternal />
		</a>
	);
};
