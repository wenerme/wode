import { Children, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
	LoginPageForm,
	type LoginPageFormIcons,
	type LoginPageFormLabels,
	type LoginPageFormMode,
	type LoginPageFormProps,
	type LoginPageFormValues,
} from './login-form';
import { type LoginPageSocialItem, LoginPageSocialLogin, type LoginPageSocialLoginProps } from './login-social';

export const LOGIN_PAGE_BEIAN_URL = 'https://beian.miit.gov.cn/';

export type LoginPageLinkProps = {
	text?: ReactNode;
	url?: string;
};

export type LoginPageFooterLinks = {
	beian?: LoginPageLinkProps;
	links?: readonly LoginPageLinkProps[];
	policy?: LoginPageLinkProps;
	terms?: LoginPageLinkProps;
};

export type LoginPageLayoutProps = Omit<ComponentPropsWithRef<'div'>, 'content'> & {
	content?: ReactNode;
	footer?: ReactNode;
	header?: ReactNode;
	hero?: ReactNode;
};

export type LoginPageHeaderLabels = {
	registerAction?: ReactNode;
	registerPrompt?: ReactNode;
};

export type LoginPageHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	actions?: ReactNode;
	headingId?: string;
	labels?: LoginPageHeaderLabels;
	logo?: ReactNode;
	onRegister?: () => void;
	subtitle?: ReactNode;
	title?: ReactNode;
};

export type LoginPageFooterProps = ComponentPropsWithRef<'footer'> &
	LoginPageFooterLinks & {
		copyright?: ReactNode;
		separator?: ReactNode;
	};

export type LoginPageHeroProps = ComponentPropsWithRef<'aside'>;

export type LoginPageCompositeProps = Omit<ComponentPropsWithRef<'div'>, 'content' | 'onSubmit' | 'title'> & {
	content?: ReactNode;
	defaultValues?: Partial<LoginPageFormValues>;
	disabled?: boolean;
	footer?: ReactNode;
	footerLinks?: LoginPageFooterLinks;
	form?: ReactNode;
	formIcons?: LoginPageFormIcons;
	formLabels?: LoginPageFormLabels;
	formMode?: LoginPageFormMode;
	header?: ReactNode;
	headerLabels?: LoginPageHeaderLabels;
	headingId?: string;
	hero?: ReactNode;
	logo?: ReactNode;
	onForgotPassword?: () => void;
	onRegister?: () => void;
	onSubmit?: LoginPageFormProps['onSubmit'];
	orgValue?: string;
	showOrg?: boolean;
	showPasswordToggle?: boolean;
	showRemember?: boolean;
	social?: ReactNode;
	socialColumns?: LoginPageSocialLoginProps['columns'];
	socialTitle?: ReactNode;
	socials?: readonly LoginPageSocialItem[];
	subtitle?: ReactNode;
	title?: ReactNode;
};

export function LoginPageComposite({
	children,
	className,
	content,
	defaultValues,
	disabled,
	footer,
	footerLinks,
	form,
	formIcons,
	formLabels,
	formMode,
	header,
	headerLabels,
	headingId,
	hero,
	logo,
	onForgotPassword,
	onRegister,
	onSubmit,
	orgValue,
	showOrg,
	showPasswordToggle,
	showRemember,
	social,
	socialColumns,
	socialTitle,
	socials,
	subtitle = '登录系统',
	title,
	...props
}: LoginPageCompositeProps) {
	const headerContent =
		header === undefined ? (
			<LoginPageHeader
				logo={logo}
				title={title}
				subtitle={subtitle}
				headingId={headingId}
				labels={headerLabels}
				onRegister={onRegister}
			/>
		) : (
			header
		);
	const formContent =
		form === undefined ? (
			<LoginPageForm
				onSubmit={onSubmit}
				defaultValues={defaultValues}
				showOrg={showOrg}
				orgValue={orgValue}
				onForgotPassword={onForgotPassword}
				mode={formMode}
				labels={formLabels}
				icons={formIcons}
				showRemember={showRemember}
				showPasswordToggle={showPasswordToggle}
				disabled={disabled}
			/>
		) : (
			form
		);
	const socialContent =
		social === undefined ? (
			<LoginPageSocialLogin socials={socials} title={socialTitle} columns={socialColumns} />
		) : (
			social
		);
	const contentNode =
		content === undefined ? (
			<>
				{formContent}
				{socialContent}
				{children}
			</>
		) : (
			content
		);
	const footerContent =
		footer === undefined ? (
			<LoginPageFooter
				policy={footerLinks?.policy}
				terms={footerLinks?.terms}
				beian={footerLinks?.beian}
				links={footerLinks?.links}
			/>
		) : (
			(footer ?? undefined)
		);

	return (
		<LoginPageLayout
			className={className}
			header={headerContent}
			content={contentNode}
			footer={footerContent}
			hero={hero}
			{...props}
		/>
	);
}

export function LoginPageLayout({
	header,
	children,
	content,
	hero,
	footer,
	className,
	...props
}: LoginPageLayoutProps) {
	return (
		<div data-slot='login-page' className={cn('bg-base-100 flex min-h-svh min-w-0', className)} {...props}>
			<div
				data-slot='login-page-panel'
				className={cn('flex min-w-0 flex-1 flex-col', hero && 'lg:w-[32rem] lg:flex-none xl:w-[36rem]')}
			>
				<div className='flex flex-1 items-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16'>
					<div className='mx-auto w-full max-w-sm'>
						{header}
						{content}
						{children}
					</div>
				</div>
				{footer !== undefined ? (
					<div data-slot='login-page-footer-region' className='shrink-0 px-4 py-4 sm:px-8 lg:px-12 xl:px-16'>
						{footer}
					</div>
				) : null}
			</div>
			{hero ? <LoginPageHero>{hero}</LoginPageHero> : null}
		</div>
	);
}

export function LoginPageHeader({
	actions,
	headingId,
	labels,
	logo,
	onRegister,
	subtitle,
	title,
	className,
	...props
}: LoginPageHeaderProps) {
	return (
		<header data-slot='login-page-header' className={className} {...props}>
			<div className='flex min-w-0 items-center gap-3'>
				{logo ? <span className='grid size-10 shrink-0 place-items-center'>{logo}</span> : null}
				{title ? <div className='min-w-0 flex-1 truncate text-lg font-semibold'>{title}</div> : null}
				{actions}
			</div>
			{subtitle ? (
				<h1 id={headingId} className='mt-8 text-2xl leading-9 font-bold tracking-tight'>
					{subtitle}
				</h1>
			) : null}
			{onRegister ? (
				<p className='text-base-content/60 mt-2 text-sm leading-6'>
					{labels?.registerPrompt ?? '尚未加入？'}{' '}
					<button type='button' onClick={onRegister} className='text-primary hover:text-primary/80 font-semibold'>
						{labels?.registerAction ?? '现在注册'}
					</button>
				</p>
			) : null}
		</header>
	);
}

export function LoginPageFooter({
	beian,
	copyright,
	links,
	policy,
	separator = <span aria-hidden='true'>•</span>,
	terms,
	className,
	...props
}: LoginPageFooterProps) {
	const items: ReactNode[] = [copyright === undefined ? `© ${new Date().getFullYear()}` : copyright];
	const policyLink = renderLoginPageLink(policy, '隐私政策');
	const termsLink = renderLoginPageLink(terms, '服务条款');
	if (policyLink) items.push(policyLink);
	if (termsLink) items.push(termsLink);
	for (const link of links ?? []) {
		const item = renderLoginPageLink(link);
		if (item) items.push(item);
	}
	const beianLink = renderLoginPageLink(beian?.text ? { ...beian, url: beian.url ?? LOGIN_PAGE_BEIAN_URL } : undefined);
	if (beianLink) items.push(beianLink);
	const visibleItems = items.filter((item) => item !== null && item !== undefined && item !== false);
	const separatorNode = <span className='mx-1.5'>{separator}</span>;

	return (
		<footer
			data-slot='login-page-footer'
			className={cn('text-base-content/60 text-center text-xs leading-6', className)}
			{...props}
		>
			{Children.toArray(visibleItems.flatMap((item) => [separatorNode, item]).slice(1))}
		</footer>
	);
}

export function LoginPageHero({ className, ...props }: LoginPageHeroProps) {
	return (
		<aside
			data-slot='login-page-hero'
			className={cn('bg-neutral relative hidden min-w-0 flex-1 overflow-hidden lg:block', className)}
			{...props}
		/>
	);
}

export function getSafeLoginPageHref(url?: string) {
	if (!url) return undefined;
	const value = url.trim();
	if (!value || hasUnsafeLoginPageCharacter(value) || value.startsWith('//')) return undefined;
	if (
		value.startsWith('#') ||
		value.startsWith('/') ||
		value.startsWith('./') ||
		value.startsWith('../') ||
		value.startsWith('?')
	) {
		return value;
	}
	const scheme = /^([a-z][a-z\d+.-]*):/i.exec(value)?.[1]?.toLowerCase();
	if (!scheme) return value;
	if (scheme !== 'https') return undefined;
	try {
		const parsed = new URL(value);
		if (parsed.username || parsed.password) return undefined;
		return value;
	} catch {
		return undefined;
	}
}

function hasUnsafeLoginPageCharacter(value: string) {
	for (const character of value) {
		const code = character.charCodeAt(0);
		if (code <= 0x1f || code === 0x7f || character === '\\') return true;
	}
	return false;
}

function renderLoginPageLink(link?: LoginPageLinkProps, defaultText?: ReactNode) {
	const href = getSafeLoginPageHref(link?.url);
	const text = link?.text ?? defaultText;
	if (!href || !text) return null;
	const external = href.startsWith('https:');
	return (
		<a
			href={href}
			target={external ? '_blank' : undefined}
			rel={external ? 'noopener noreferrer' : undefined}
			className='hover:text-base-content hover:underline'
		>
			{text}
		</a>
	);
}

export const LoginPage = {
	Composite: LoginPageComposite,
	Footer: LoginPageFooter,
	Form: LoginPageForm,
	Header: LoginPageHeader,
	Hero: LoginPageHero,
	Layout: LoginPageLayout,
	SocialLogin: LoginPageSocialLogin,
} as const;
