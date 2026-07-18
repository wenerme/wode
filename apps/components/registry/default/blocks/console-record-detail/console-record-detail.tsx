import { AlertTriangle, ChevronRight, CircleAlert, LoaderCircle, Pencil, Save, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ConsoleRecordDetailPageProps = ComponentPropsWithRef<'article'> & {
	commandBar?: ReactNode;
	footer?: ReactNode;
	header: ReactNode;
};

export function ConsoleRecordDetailPage({
	children,
	className,
	commandBar,
	footer,
	header,
	...props
}: ConsoleRecordDetailPageProps) {
	return (
		<article className={cn('bg-base-100 text-base-content flex min-h-0 w-full flex-col', className)} {...props}>
			{hasRenderableNode(commandBar) ? commandBar : null}
			{header}
			<div className='min-h-0 flex-1'>{children}</div>
			{hasRenderableNode(footer) ? (
				<footer className='border-base-300 text-base-content/70 border-t px-4 py-2 text-xs sm:px-6'>{footer}</footer>
			) : null}
		</article>
	);
}

export type ConsoleRecordCommandBarProps = ComponentPropsWithRef<'div'> & {
	end?: ReactNode;
	label?: string;
	sticky?: boolean;
};

export function ConsoleRecordCommandBar({
	children,
	className,
	end,
	label = '记录操作',
	sticky,
	...props
}: ConsoleRecordCommandBarProps) {
	return (
		<div
			role='toolbar'
			aria-label={label}
			className={cn(
				'border-base-300 bg-base-100 flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 sm:px-5',
				sticky && 'sticky top-0 z-20',
				className,
			)}
			{...props}
		>
			<div className='flex min-w-0 flex-wrap items-center gap-1'>{children}</div>
			{hasRenderableNode(end) ? <div className='flex shrink-0 flex-wrap items-center gap-2'>{end}</div> : null}
		</div>
	);
}

export type ConsoleRecordEditMessages = {
	cancel: string;
	edit: string;
	save: string;
	saving: string;
};

export type ConsoleRecordEditActionsProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	dirty: boolean;
	editing: boolean;
	messages?: Partial<ConsoleRecordEditMessages>;
	onCancel: () => void;
	onEdit: () => void;
	onSave: () => void;
	saving?: boolean;
};

const defaultEditMessages: ConsoleRecordEditMessages = {
	cancel: '取消',
	edit: '编辑',
	save: '保存',
	saving: '保存中',
};

export function ConsoleRecordEditActions({
	className,
	dirty,
	editing,
	messages: messageOverrides,
	onCancel,
	onEdit,
	onSave,
	saving = false,
	...props
}: ConsoleRecordEditActionsProps) {
	const messages = { ...defaultEditMessages, ...messageOverrides };
	return (
		<div className={cn('flex items-center gap-1', className)} {...props}>
			<button className='btn btn-ghost btn-sm' type='button' onClick={onEdit} disabled={editing || saving}>
				<Pencil className='size-4' /> {messages.edit}
			</button>
			{editing ? (
				<button className='btn btn-ghost btn-sm' type='button' onClick={onCancel} disabled={saving}>
					<X className='size-4' /> {messages.cancel}
				</button>
			) : null}
			<button className='btn btn-primary btn-sm' type='button' onClick={onSave} disabled={!editing || !dirty || saving}>
				{saving ? <LoaderCircle className='size-4 animate-spin' /> : <Save className='size-4' />}
				{saving ? messages.saving : messages.save}
			</button>
		</div>
	);
}

export type ConsoleRecordHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	actions?: ReactNode;
	avatar?: ReactNode;
	badges?: ReactNode;
	eyebrow?: ReactNode;
	metadata?: ReactNode;
	status?: ReactNode;
	subtitle?: ReactNode;
	title: ReactNode;
};

export function ConsoleRecordHeader({
	actions,
	avatar,
	badges,
	className,
	eyebrow,
	metadata,
	status,
	subtitle,
	title,
	...props
}: ConsoleRecordHeaderProps) {
	return (
		<header className={cn('border-base-300 bg-base-100 border-b px-4 py-5 sm:px-6', className)} {...props}>
			<div className='flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start'>
				{hasRenderableNode(avatar) ? (
					<div className='bg-primary text-primary-content grid size-16 shrink-0 place-items-center rounded-md text-xl font-semibold sm:size-20'>
						{avatar}
					</div>
				) : null}
				<div className='min-w-0 flex-1'>
					{hasRenderableNode(eyebrow) ? (
						<div className='text-base-content/70 text-xs font-medium'>{eyebrow}</div>
					) : null}
					<div className='mt-1 flex min-w-0 flex-wrap items-center gap-2'>
						<h1 className='min-w-0 text-2xl font-semibold break-words'>{title}</h1>
						{hasRenderableNode(status) ? <div className='shrink-0'>{status}</div> : null}
					</div>
					{hasRenderableNode(subtitle) ? (
						<div className='text-base-content/70 mt-1 text-sm leading-6'>{subtitle}</div>
					) : null}
					{hasRenderableNode(badges) ? <div className='mt-3 flex flex-wrap items-center gap-2'>{badges}</div> : null}
					{hasRenderableNode(metadata) ? (
						<div className='text-base-content/70 mt-3 text-xs leading-5'>{metadata}</div>
					) : null}
				</div>
				{hasRenderableNode(actions) ? (
					<div className='flex shrink-0 flex-wrap items-center gap-2'>{actions}</div>
				) : null}
			</div>
		</header>
	);
}

export type ConsoleRecordContentLayoutProps = ComponentPropsWithRef<'div'> & {
	aside?: ReactNode;
	asideLabel?: string;
	asideWidth?: string;
	main: ReactNode;
};

export function ConsoleRecordContentLayout({
	aside,
	asideLabel = '记录上下文',
	asideWidth = '20rem',
	className,
	main,
	style,
	...props
}: ConsoleRecordContentLayoutProps) {
	return (
		<div
			className={cn(
				'mx-auto grid w-full max-w-7xl grid-cols-1 xl:grid-cols-[minmax(0,1fr)_var(--record-aside-width)]',
				className,
			)}
			style={{ ...style, '--record-aside-width': asideWidth } as React.CSSProperties}
			{...props}
		>
			<div className='min-w-0 px-4 py-5 sm:px-6'>{main}</div>
			{hasRenderableNode(aside) ? (
				<aside
					aria-label={asideLabel}
					className='border-base-300 min-w-0 border-t px-4 py-5 sm:px-6 xl:border-t-0 xl:border-l'
				>
					{aside}
				</aside>
			) : null}
		</div>
	);
}

export type ConsoleRecordSectionProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
	actions?: ReactNode;
	description?: ReactNode;
	title: ReactNode;
};

export function ConsoleRecordSection({
	actions,
	children,
	className,
	description,
	title,
	...props
}: ConsoleRecordSectionProps) {
	return (
		<section className={cn('not-first:mt-7', className)} {...props}>
			<div className='border-base-300 flex min-w-0 items-start justify-between gap-4 border-b pb-2'>
				<div className='min-w-0'>
					<h2 className='text-sm font-semibold'>{title}</h2>
					{hasRenderableNode(description) ? (
						<div className='text-base-content/70 mt-1 text-xs leading-5'>{description}</div>
					) : null}
				</div>
				{hasRenderableNode(actions) ? <div className='flex shrink-0 items-center gap-1'>{actions}</div> : null}
			</div>
			<div className='mt-3'>{children}</div>
		</section>
	);
}

export type ConsoleRecordFact = {
	description?: ReactNode;
	id: string;
	label: ReactNode;
	value: ReactNode;
};

export type ConsoleRecordFactListProps = Omit<ComponentPropsWithRef<'dl'>, 'children'> & {
	columns?: 1 | 2 | 3;
	empty?: ReactNode;
	emptyLabel?: string;
	facts: ConsoleRecordFact[];
};

const factGridClasses = {
	1: 'grid-cols-1',
	2: 'grid-cols-1 md:grid-cols-2',
	3: 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3',
} as const;

export function ConsoleRecordFactList({
	className,
	columns = 2,
	empty = '暂无信息',
	emptyLabel = '信息',
	facts,
	...props
}: ConsoleRecordFactListProps) {
	if (facts.length === 0) {
		return (
			<dl className={cn('text-base-content/70 border-base-300 border-y py-5 text-sm', className)} {...props}>
				<div>
					<dt className='sr-only'>{emptyLabel}</dt>
					<dd>{empty}</dd>
				</div>
			</dl>
		);
	}
	return (
		<dl className={cn('border-base-300 grid gap-x-6 border-t', factGridClasses[columns], className)} {...props}>
			{facts.map((fact) => (
				<div key={fact.id} className='border-base-300 min-w-0 border-b py-3'>
					<dt className='text-base-content/70 text-xs'>{fact.label}</dt>
					<dd className='mt-1 min-w-0 break-words'>
						<div className='text-sm font-medium'>{fact.value}</div>
						{hasRenderableNode(fact.description) ? (
							<div className='text-base-content/70 mt-1 text-xs leading-5'>{fact.description}</div>
						) : null}
					</dd>
				</div>
			))}
		</dl>
	);
}

export type ConsoleRecordActivity = {
	actor?: ReactNode;
	dateTime?: string;
	description?: ReactNode;
	icon?: ReactNode;
	id: string;
	time?: ReactNode;
	title: ReactNode;
};

export type ConsoleRecordActivityListProps = ComponentPropsWithRef<'ol'> & {
	activities: ConsoleRecordActivity[];
	empty?: ReactNode;
};

export function ConsoleRecordActivityList({
	activities,
	className,
	empty = '暂无活动',
	...props
}: ConsoleRecordActivityListProps) {
	if (activities.length === 0) {
		return (
			<ol className={cn('text-base-content/70 py-5 text-sm', className)} {...props}>
				<li>{empty}</li>
			</ol>
		);
	}
	return (
		<ol className={cn('relative', className)} {...props}>
			{activities.map((activity, index) => (
				<li key={activity.id} className='grid grid-cols-[2rem_minmax(0,1fr)] gap-3'>
					<div className='relative flex justify-center'>
						{index < activities.length - 1 ? (
							<span aria-hidden='true' className='bg-base-300 absolute top-7 bottom-0 w-px' />
						) : null}
						<span className='border-base-300 bg-base-100 z-10 grid size-7 place-items-center rounded-full border'>
							{activity.icon ?? <span className='bg-base-content/40 size-1.5 rounded-full' />}
						</span>
					</div>
					<div className='border-base-300 min-w-0 border-b pb-4 not-first:pt-1'>
						<div className='flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between'>
							<div className='min-w-0 text-sm font-medium'>{activity.title}</div>
							{hasRenderableNode(activity.time) ? (
								<time dateTime={activity.dateTime} className='text-base-content/70 shrink-0 text-xs'>
									{activity.time}
								</time>
							) : null}
						</div>
						{hasRenderableNode(activity.description) ? (
							<div className='text-base-content/70 mt-1 text-sm leading-6'>{activity.description}</div>
						) : null}
						{hasRenderableNode(activity.actor) ? (
							<div className='text-base-content/70 mt-1 text-xs'>{activity.actor}</div>
						) : null}
					</div>
				</li>
			))}
		</ol>
	);
}

export type ConsoleRecordRelatedItem = {
	actions?: ReactNode;
	href?: string;
	id: string;
	meta?: ReactNode;
	status?: ReactNode;
	subtitle?: ReactNode;
	title: ReactNode;
};

export type ConsoleRecordRelatedListProps = ComponentPropsWithRef<'ul'> & {
	empty?: ReactNode;
	items: ConsoleRecordRelatedItem[];
};

export function ConsoleRecordRelatedList({
	className,
	empty = '暂无关联记录',
	items,
	...props
}: ConsoleRecordRelatedListProps) {
	if (items.length === 0) {
		return (
			<ul className={cn('text-base-content/70 py-5 text-sm', className)} {...props}>
				<li>{empty}</li>
			</ul>
		);
	}
	return (
		<ul className={cn('border-base-300 divide-base-300 divide-y border-y', className)} {...props}>
			{items.map((item) => {
				const content = (
					<>
						<span className='min-w-0 flex-1'>
							<span className='flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium'>
								<span className='min-w-0 break-words'>{item.title}</span>
								{hasRenderableNode(item.status) ? item.status : null}
							</span>
							{hasRenderableNode(item.subtitle) ? (
								<span className='text-base-content/70 mt-1 block text-xs'>{item.subtitle}</span>
							) : null}
							{hasRenderableNode(item.meta) ? (
								<span className='text-base-content/70 mt-1 block text-xs'>{item.meta}</span>
							) : null}
						</span>
					</>
				);
				return (
					<li key={item.id} className='flex min-w-0 items-center gap-2'>
						<div className='min-w-0 flex-1'>
							{item.href ? (
								<a
									href={item.href}
									className='hover:bg-base-200/50 focus-visible:ring-primary flex min-w-0 items-center gap-3 px-1 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset'
								>
									{content}
									<ChevronRight aria-hidden='true' className='text-base-content/60 size-4 shrink-0' />
								</a>
							) : (
								<div className='flex min-w-0 items-center gap-3 px-1 py-3'>{content}</div>
							)}
						</div>
						{hasRenderableNode(item.actions) ? <div className='shrink-0'>{item.actions}</div> : null}
					</li>
				);
			})}
		</ul>
	);
}

export type ConsoleRecordStateProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
	actions?: ReactNode;
	description?: ReactNode;
	icon?: ReactNode;
	state?: 'loading' | 'empty' | 'error';
	title?: ReactNode;
};

const stateDefaults = {
	loading: { icon: <LoaderCircle className='size-5 animate-spin' />, title: '正在加载记录' },
	empty: { icon: <CircleAlert className='size-5' />, title: '未找到记录' },
	error: { icon: <AlertTriangle className='size-5' />, title: '无法加载记录' },
} as const;

export function ConsoleRecordState({
	actions,
	className,
	description,
	icon,
	state = 'empty',
	title,
	...props
}: ConsoleRecordStateProps) {
	const defaults = stateDefaults[state];
	return (
		<section
			className={cn('grid min-h-72 place-items-center px-5 py-10 text-center', className)}
			role={state === 'error' ? 'alert' : state === 'loading' ? 'status' : undefined}
			{...props}
		>
			<div className='max-w-md'>
				<div
					className={cn(
						'mx-auto grid size-10 place-items-center rounded-full',
						state === 'error' ? 'bg-error/10 text-error' : 'bg-base-200',
					)}
				>
					{icon ?? defaults.icon}
				</div>
				<h2 className='mt-3 text-base font-semibold'>{title ?? defaults.title}</h2>
				{hasRenderableNode(description) ? (
					<div className='text-base-content/70 mt-1 text-sm leading-6'>{description}</div>
				) : null}
				{hasRenderableNode(actions) ? <div className='mt-4 flex justify-center gap-2'>{actions}</div> : null}
			</div>
		</section>
	);
}

function hasRenderableNode(value: ReactNode) {
	return value !== undefined && value !== null && value !== false;
}
