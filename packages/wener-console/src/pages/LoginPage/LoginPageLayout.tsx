import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { LoginPageHero } from './LoginPageHero';

export interface LoginLayoutProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'content'> {
	header?: ReactNode;
	children?: ReactNode;
	content?: ReactNode;
	hero?: ReactNode;
	footer?: ReactNode;
}

export const LoginPageLayout: FC<LoginLayoutProps> = ({
	header,
	children,
	content,
	hero,
	footer,
	className,
	...props
}) => {
	/*

Left | Right

Left
Header | Title
Content
Footer

Right
Hero
 */

	return (
		<div className={cn('flex min-h-full flex-1', className)} {...props}>
			{/* Left Column */}
			<div className='relative flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24'>
				<div className='mx-auto w-full max-w-sm lg:w-96'>
					{header}
					{content}
					{children}
				</div>
				{footer && (
					<footer className='absolute inset-x-0 bottom-0 flex w-full flex-col items-center px-4 pb-2 sm:px-6 lg:px-20 xl:px-24'>
						{footer}
					</footer>
				)}
			</div>
			{/* Right Column - Hero */}
			{hero && <LoginPageHero>{hero}</LoginPageHero>}
		</div>
	);
};
