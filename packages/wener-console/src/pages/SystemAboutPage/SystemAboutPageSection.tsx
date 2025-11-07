import React, { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface SystemAboutPageSectionProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
	title?: ReactNode;
	icon?: ReactNode;
	header?: ReactNode;
	footer?: ReactNode;
	children?: ReactNode;
}

export const SystemAboutPageSection: FC<SystemAboutPageSectionProps> = ({
	title,
	icon,
	header,
	footer,
	children,
	className,
	...props
}) => {
	header ??= (
		<>
			{icon}
			<span className={'text-xl font-medium'}>{title}</span>
		</>
	);

	return (
		<div className={cn('rounded-lg border shadow', className)} {...props}>
			{Boolean(header) && <div className={'flex items-center gap-2 border-b px-4 py-2'}>{header}</div>}
			<div className={'px-4 py-3'}>{children}</div>
			{footer && <div className={'border-t px-4 py-2'}>{footer}</div>}
		</div>
	);
};
