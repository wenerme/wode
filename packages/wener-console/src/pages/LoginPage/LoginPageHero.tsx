import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface HeroProps extends ComponentPropsWithoutRef<'div'> {
	children?: ReactNode;
}

export const LoginPageHero: FC<HeroProps> = ({ children, className, ...props }) => {
	return (
		<div className={cn('relative hidden w-0 flex-1 lg:block', className)} {...props}>
			{children}
		</div>
	);
};
