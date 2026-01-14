import type { FC, HTMLProps, ReactNode } from 'react';
import { TitleTabLayout } from '../../components';
import { cn } from '../../utils/cn';

export const SettingLayout: FC<
	{ title?: ReactNode; action?: ReactNode; children?: ReactNode } & Omit<HTMLProps<HTMLDivElement>, 'title' | 'action'>
> = ({ title, children, className, action, ...props }) => {
	return (
		<TitleTabLayout title={title || '设置'} tabs={[]} className={cn('h-full', className)} action={action} {...props}>
			{children}
		</TitleTabLayout>
	);
};
