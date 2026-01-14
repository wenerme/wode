import type { ComponentPropsWithRef } from 'react';
import { HiExclamationCircle } from 'react-icons/hi2';
import { showErrorToast } from '../../toast';
import { cn } from '../../utils/cn';

export const ErrorPlaceholder = ({ error, className, ...props }: { error: any } & ComponentPropsWithRef<'div'>) => {
	if (!error) {
		return null;
	}
	return (
		<div
			role={'button'}
			className={cn('btn btn-square btn-ghost btn-xs text-warning flex items-center', className)}
			{...props}
			onClick={() => {
				showErrorToast(error);
			}}
		>
			<HiExclamationCircle className={'h-4 w-4'} />
		</div>
	);
};
