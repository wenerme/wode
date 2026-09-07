import { ExternalLink } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ConsoleAboutTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export type ConsoleAboutDetail = {
	description?: ReactNode;
	icon?: ReactNode;
	id?: string;
	label: ReactNode;
	value: ReactNode;
};

export type ConsoleAboutLink = {
	description?: ReactNode;
	external?: boolean;
	href: string;
	icon?: ReactNode;
	id?: string;
	label: string;
	rel?: string;
	target?: ComponentPropsWithRef<'a'>['target'];
};

export type ConsoleAboutMaintainer = {
	avatar?: ReactNode;
	href?: string;
	id?: string;
	name: ReactNode;
	role?: ReactNode;
};

export type ConsoleAboutStatus = {
	icon?: ReactNode;
	label: ReactNode;
	tone?: ConsoleAboutTone;
};

export type ConsoleAboutMessages = {
	buildLabel: string;
	diagnosticsTitle: string;
	environmentLabel: string;
	linksLabel: string;
	linksTitle: string;
	maintainersTitle: string;
	opensNewWindow: string;
	runtimeTitle: string;
	supportTitle: string;
	versionLabel: string;
};

const defaultConsoleAboutMessages: ConsoleAboutMessages = {
	versionLabel: '版本',
	buildLabel: '构建',
	environmentLabel: '环境',
	runtimeTitle: '运行信息',
	diagnosticsTitle: '客户端环境',
	linksTitle: '资源与文档',
	linksLabel: '资源与文档',
	maintainersTitle: '维护团队',
	supportTitle: '支持',
	opensNewWindow: '将在新窗口打开',
};

export type ConsoleAboutPageProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
	actions?: ReactNode;
	build?: ReactNode;
	description?: ReactNode;
	details?: ConsoleAboutDetail[];
	diagnostics?: ReactNode;
	environment?: ReactNode;
	footer?: ReactNode;
	links?: ConsoleAboutLink[];
	logo?: ReactNode;
	maintainers?: ConsoleAboutMaintainer[];
	messages?: Partial<ConsoleAboutMessages>;
	product: ReactNode;
	status?: ConsoleAboutStatus;
	support?: ReactNode;
	version?: ReactNode;
};

export function ConsoleAboutPage({
	actions,
	build,
	children,
	className,
	description,
	details = [],
	diagnostics,
	environment,
	footer,
	links = [],
	logo,
	maintainers = [],
	messages: messagesOverride,
	product,
	status,
	support,
	version,
	...props
}: ConsoleAboutPageProps) {
	const messages = { ...defaultConsoleAboutMessages, ...messagesOverride };
	const summary = [
		...(hasRenderableNode(version) ? [{ label: messages.versionLabel, value: version }] : []),
		...(hasRenderableNode(build) ? [{ label: messages.buildLabel, value: build }] : []),
		...(hasRenderableNode(environment) ? [{ label: messages.environmentLabel, value: environment }] : []),
	];

	return (
		<section className={cn('mx-auto w-full max-w-4xl', className)} {...props}>
			<header className='border-base-300 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center'>
				{hasRenderableNode(logo) ? (
					<div className='border-base-300 bg-base-100 text-primary grid size-16 shrink-0 place-items-center rounded-md border shadow-sm'>
						{logo}
					</div>
				) : null}
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap items-center gap-2'>
						<h1 className='min-w-0 text-2xl font-semibold break-words'>{product}</h1>
						{status ? <ConsoleAboutStatusBadge status={status} /> : null}
					</div>
					{hasRenderableNode(description) ? (
						<div className='text-base-content/65 mt-2 max-w-2xl text-sm leading-6'>{description}</div>
					) : null}
				</div>
				{hasRenderableNode(actions) ? (
					<div className='flex shrink-0 flex-wrap items-center gap-2'>{actions}</div>
				) : null}
			</header>

			{summary.length > 0 ? (
				<dl className='border-base-300 mt-6 grid border-y sm:grid-cols-3 sm:divide-x'>
					{summary.map((item) => (
						<div
							key={String(item.label)}
							className='border-base-300 min-w-0 border-b px-0 py-3 last:border-b-0 sm:border-b-0 sm:px-4 sm:first:pl-0 sm:last:pr-0'
						>
							<dt className='text-base-content/70 text-xs'>{item.label}</dt>
							<dd className='mt-1 min-w-0 text-sm font-medium break-words'>{item.value}</dd>
						</div>
					))}
				</dl>
			) : null}

			{details.length > 0 ? (
				<ConsoleAboutSection title={messages.runtimeTitle}>
					<ConsoleAboutDetailList details={details} />
				</ConsoleAboutSection>
			) : null}

			{hasRenderableNode(diagnostics) ? (
				<ConsoleAboutSection title={messages.diagnosticsTitle}>{diagnostics}</ConsoleAboutSection>
			) : null}

			{children}

			{maintainers.length > 0 || hasRenderableNode(support) ? (
				<div className='grid gap-x-8 md:grid-cols-2'>
					{maintainers.length > 0 ? (
						<ConsoleAboutSection title={messages.maintainersTitle}>
							<ConsoleAboutMaintainerList maintainers={maintainers} />
						</ConsoleAboutSection>
					) : null}
					{hasRenderableNode(support) ? (
						<ConsoleAboutSection title={messages.supportTitle}>{support}</ConsoleAboutSection>
					) : null}
				</div>
			) : null}

			{links.length > 0 ? (
				<ConsoleAboutSection title={messages.linksTitle}>
					<ConsoleAboutLinkList aria-label={messages.linksLabel} links={links} messages={messages} />
				</ConsoleAboutSection>
			) : null}

			{hasRenderableNode(footer) ? (
				<footer className='border-base-300 text-base-content/70 mt-8 border-t pt-4 text-xs leading-5'>{footer}</footer>
			) : null}
		</section>
	);
}

export type ConsoleAboutSectionProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
	actions?: ReactNode;
	description?: ReactNode;
	footer?: ReactNode;
	icon?: ReactNode;
	title: ReactNode;
};

export function ConsoleAboutSection({
	actions,
	children,
	className,
	description,
	footer,
	icon,
	title,
	...props
}: ConsoleAboutSectionProps) {
	return (
		<section className={cn('mt-8', className)} {...props}>
			<header className='border-base-300 flex items-start gap-3 border-b pb-2.5'>
				{hasRenderableNode(icon) ? <div className='text-primary mt-0.5 shrink-0'>{icon}</div> : null}
				<div className='min-w-0 flex-1'>
					<h2 className='text-sm font-semibold'>{title}</h2>
					{hasRenderableNode(description) ? (
						<div className='text-base-content/70 mt-1 text-xs leading-5'>{description}</div>
					) : null}
				</div>
				{hasRenderableNode(actions) ? <div className='shrink-0'>{actions}</div> : null}
			</header>
			<div className='pt-3'>{children}</div>
			{hasRenderableNode(footer) ? (
				<footer className='border-base-300 text-base-content/70 mt-3 border-t pt-3 text-xs'>{footer}</footer>
			) : null}
		</section>
	);
}

export type ConsoleAboutDetailListProps = ComponentPropsWithRef<'dl'> & {
	details: ConsoleAboutDetail[];
};

export function ConsoleAboutDetailList({ className, details, ...props }: ConsoleAboutDetailListProps) {
	return (
		<dl className={cn('divide-base-300 border-base-300 divide-y border-y', className)} {...props}>
			{details.map((item, index) => (
				<div
					key={item.id ?? index}
					className='grid min-w-0 gap-2 py-3 text-sm sm:grid-cols-[minmax(7rem,10rem)_minmax(0,1fr)] sm:gap-4'
				>
					<dt className='text-base-content/70 flex items-start gap-2'>
						{hasRenderableNode(item.icon) ? <span className='mt-0.5 shrink-0'>{item.icon}</span> : null}
						<span>{item.label}</span>
					</dt>
					<dd className='min-w-0 break-words'>
						<div className='font-medium'>{item.value}</div>
						{hasRenderableNode(item.description) ? (
							<div className='text-base-content/70 mt-1 text-xs leading-5'>{item.description}</div>
						) : null}
					</dd>
				</div>
			))}
		</dl>
	);
}

export type ConsoleAboutLinkListProps = Omit<ComponentPropsWithRef<'nav'>, 'children'> & {
	links: ConsoleAboutLink[];
	messages?: Pick<ConsoleAboutMessages, 'opensNewWindow'>;
};

export function ConsoleAboutLinkList({ className, links, messages, ...props }: ConsoleAboutLinkListProps) {
	return (
		<nav className={cn('divide-base-300 border-base-300 divide-y border-y', className)} {...props}>
			{links.map((link, index) => {
				const external = link.external ?? true;
				const target = link.target ?? (external ? '_blank' : undefined);
				const relTokens = new Set(link.rel?.split(/\s+/).filter(Boolean));
				if (target === '_blank') {
					relTokens.add('noopener');
					relTokens.add('noreferrer');
				}
				const rel = relTokens.size > 0 ? [...relTokens].join(' ') : undefined;
				return (
					<a
						key={link.id ?? index}
						href={link.href}
						target={target}
						rel={rel}
						aria-label={
							target === '_blank' ? `${link.label}，${messages?.opensNewWindow ?? '将在新窗口打开'}` : undefined
						}
						className='hover:text-primary focus-visible:ring-primary flex min-w-0 items-center gap-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset'
					>
						{hasRenderableNode(link.icon) ? <span className='shrink-0'>{link.icon}</span> : null}
						<span className='min-w-0 flex-1'>
							<span className='block font-medium'>{link.label}</span>
							{hasRenderableNode(link.description) ? (
								<span className='text-base-content/70 mt-0.5 block text-xs leading-5'>{link.description}</span>
							) : null}
						</span>
						{target === '_blank' ? <ExternalLink aria-hidden='true' className='size-3.5 shrink-0' /> : null}
					</a>
				);
			})}
		</nav>
	);
}

export type ConsoleAboutMaintainerListProps = ComponentPropsWithRef<'ul'> & {
	maintainers: ConsoleAboutMaintainer[];
};

export function ConsoleAboutMaintainerList({ className, maintainers, ...props }: ConsoleAboutMaintainerListProps) {
	return (
		<ul className={cn('divide-base-300 border-base-300 divide-y border-y', className)} {...props}>
			{maintainers.map((maintainer, index) => {
				const content = (
					<>
						{hasRenderableNode(maintainer.avatar) ? (
							<span className='bg-base-200 grid size-9 shrink-0 place-items-center rounded-full'>
								{maintainer.avatar}
							</span>
						) : null}
						<span className='min-w-0 flex-1'>
							<span className='block truncate text-sm font-medium'>{maintainer.name}</span>
							{hasRenderableNode(maintainer.role) ? (
								<span className='text-base-content/70 mt-0.5 block truncate text-xs'>{maintainer.role}</span>
							) : null}
						</span>
					</>
				);
				return (
					<li key={maintainer.id ?? index}>
						{maintainer.href ? (
							<a
								href={maintainer.href}
								target='_blank'
								rel='noopener noreferrer'
								className='hover:text-primary focus-visible:ring-primary flex items-center gap-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset'
							>
								{content}
								<ExternalLink aria-hidden='true' className='size-3.5 shrink-0' />
							</a>
						) : (
							<div className='flex items-center gap-3 py-3'>{content}</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}

function ConsoleAboutStatusBadge({ status }: { status: ConsoleAboutStatus }) {
	const tones: Record<ConsoleAboutTone, string> = {
		neutral: 'badge-neutral',
		info: 'badge-info',
		success: 'badge-success',
		warning: 'badge-warning',
		error: 'badge-error',
	};
	return (
		<span className={cn('badge badge-sm gap-1', tones[status.tone ?? 'neutral'])}>
			{hasRenderableNode(status.icon) ? status.icon : null}
			{status.label}
		</span>
	);
}

function hasRenderableNode(value: ReactNode) {
	return value !== null && value !== undefined && value !== false;
}
