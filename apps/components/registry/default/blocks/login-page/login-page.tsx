import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export namespace LoginPage {
	export type LinkProps = {
		url?: string;
		text?: string;
	};

	export type LayoutProps = Omit<ComponentPropsWithRef<'div'>, 'content'> & {
		header?: ReactNode;
		content?: ReactNode;
		hero?: ReactNode;
		footer?: ReactNode;
	};

	export type HeaderProps = ComponentPropsWithRef<'div'> & {
		logo?: ReactNode;
		title?: string;
		subtitle?: ReactNode;
		onRegister?: () => void;
	};

	export type FooterProps = ComponentPropsWithRef<'footer'> & {
		policy?: LinkProps;
		terms?: LinkProps;
		beian?: LinkProps;
	};

	export type HeroProps = ComponentPropsWithRef<'div'>;

	export interface CompositeProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'content'> {
		title?: string;
		subtitle?: ReactNode;
		hero?: ReactNode;
		logo?: ReactNode;
		header?: ReactNode;
		content?: ReactNode;
		onRegister?: () => void;
		footer?: {
			policy?: LinkProps;
			terms?: LinkProps;
			beian?: LinkProps;
		};
	}

	/**
	 * Composite login page combining Layout, Header, and Footer
	 */
	export function Composite({
		hero,
		children,
		title,
		subtitle = '登录系统',
		footer: footerProps = {},
		logo,
		header,
		content,
		onRegister,
		className,
		...props
	}: CompositeProps) {
		const headerContent = header ?? <Header logo={logo} title={title} subtitle={subtitle} onRegister={onRegister} />;

		const footerContent = <Footer policy={footerProps.policy} terms={footerProps.terms} beian={footerProps.beian} />;

		return (
			<Layout
				className={className}
				header={headerContent}
				content={content ?? children}
				footer={footerContent}
				hero={hero}
				{...props}
			/>
		);
	}

	/**
	 * Login page layout with left content and right hero
	 */
	export function Layout({ header, children, content, hero, footer, className, ...props }: LayoutProps) {
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
				{hero && <Hero>{hero}</Hero>}
			</div>
		);
	}

	/**
	 * Login page header with logo, title, and subtitle
	 */
	export function Header({ logo, title, subtitle, onRegister, className, ...props }: HeaderProps) {
		return (
			<div className={className} {...props}>
				<div className='flex items-center gap-2'>
					{logo} <span className='text-xl font-medium'>{title}</span>
				</div>
				{subtitle && <h2 className='mt-8 text-2xl leading-9 font-bold tracking-tight opacity-80'>{subtitle}</h2>}
				{onRegister && (
					<p className='mt-2 text-sm leading-6 opacity-60'>
						尚未加入?{' '}
						<button type='button' onClick={onRegister} className='font-semibold text-indigo-600 hover:text-indigo-500'>
							现在注册
						</button>
					</p>
				)}
			</div>
		);
	}

	/**
	 * Login page footer with policy, terms, and beian links
	 */
	export function Footer({ policy, terms, beian, className, ...props }: FooterProps) {
		const items = [
			<span key='year'>© {new Date().getFullYear()}</span>,
			policy?.url && policy?.text && (
				<a key='policy' href={policy.url} target='_blank' rel='noopener noreferrer' className='hover:underline'>
					{policy.text}
				</a>
			),
			terms?.url && terms?.text && (
				<a key='terms' href={terms.url} target='_blank' rel='noopener noreferrer' className='hover:underline'>
					{terms.text}
				</a>
			),
			beian?.url && (
				<a
					key='beian'
					href={beian.url || 'https://beian.miit.gov.cn/'}
					target='_blank'
					rel='noopener noreferrer'
					className='hover:underline'
				>
					{beian.text}
				</a>
			),
		].filter(Boolean);

		return (
			<div className={cn('text-center text-sm leading-6 opacity-80', className)} {...props}>
				{items.map((item, i) => (
					<span key={i}>
						{item}
						{i < items.length - 1 && <span className='mx-1'>•</span>}
					</span>
				))}
			</div>
		);
	}

	/**
	 * Hero section for login page (right side)
	 */
	export function Hero({ children, className, ...props }: HeroProps) {
		return (
			<div className={cn('relative hidden w-0 flex-1 lg:block', className)} {...props}>
				{children}
			</div>
		);
	}
}
