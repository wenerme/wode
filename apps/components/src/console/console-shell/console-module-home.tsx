import { ArrowUpRight } from 'lucide-react';
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ConsoleModule = {
	key: string;
	title: string;
	description: string;
	href: string;
	icon?: ReactNode;
	meta?: ReactNode;
	status?: ReactNode;
};

export type ConsoleModuleHomeProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
	title?: ReactNode;
	description?: ReactNode;
	modules: ConsoleModule[];
	actions?: ReactNode;
	activity?: ReactNode;
	onModuleSelect?: (module: ConsoleModule, event: MouseEvent<HTMLAnchorElement>) => void;
};

export function ConsoleModuleHome({
	title = '模块',
	description,
	modules,
	actions,
	activity,
	onModuleSelect,
	children,
	className,
	...props
}: ConsoleModuleHomeProps) {
	return (
		<div className={cn('space-y-6', className)} {...props}>
			<div className='flex flex-wrap items-end justify-between gap-3'>
				<div className='min-w-0'>
					<h2 className='text-base font-semibold'>{title}</h2>
					{description ? <div className='text-base-content/65 mt-1 text-sm'>{description}</div> : null}
				</div>
				{actions ? <div className='flex items-center gap-2'>{actions}</div> : null}
			</div>

			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
				{modules.map((module) => (
					<ConsoleModuleCard key={module.key} module={module} onClick={(event) => onModuleSelect?.(module, event)} />
				))}
			</div>

			{activity || children ? (
				<div className='border-base-300 grid grid-cols-1 gap-6 border-t pt-5 lg:grid-cols-[minmax(0,1fr)_20rem]'>
					<div className='min-w-0'>{activity}</div>
					{children ? <aside className='border-base-300 min-w-0 lg:border-l lg:pl-6'>{children}</aside> : null}
				</div>
			) : null}
		</div>
	);
}

export type ConsoleModuleCardProps = ComponentPropsWithRef<'a'> & {
	module: ConsoleModule;
};

export function ConsoleModuleCard({ module, className, ...props }: ConsoleModuleCardProps) {
	return (
		<a
			href={module.href}
			className={cn(
				'group border-base-300 bg-base-100 flex min-h-36 flex-col border p-4 transition-colors outline-none',
				'hover:border-primary/50 hover:bg-base-200/55 focus-visible:ring-primary rounded-md focus-visible:ring-2',
				className,
			)}
			{...props}
		>
			<div className='flex items-start gap-3'>
				{module.icon ? (
					<span className='bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-md'>
						{module.icon}
					</span>
				) : null}
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<h3 className='truncate text-sm font-semibold'>{module.title}</h3>
						{module.status}
					</div>
					<p className='text-base-content/65 mt-1 line-clamp-2 text-sm leading-5'>{module.description}</p>
				</div>
				<ArrowUpRight className='text-base-content/30 group-hover:text-primary size-4 shrink-0 transition-colors' />
			</div>
			{module.meta ? <div className='text-base-content/65 mt-auto pt-4 text-xs'>{module.meta}</div> : null}
		</a>
	);
}

export type ConsoleActivityListProps = Omit<ComponentPropsWithRef<'ol'>, 'title'> & {
	title?: ReactNode;
};

export function ConsoleActivityList({ title = '最近活动', children, className, ...props }: ConsoleActivityListProps) {
	return (
		<section>
			<h3 className='mb-3 text-sm font-semibold'>{title}</h3>
			<ol className={cn('divide-base-300 border-base-300 divide-y border-y', className)} {...props}>
				{children}
			</ol>
		</section>
	);
}

export type ConsoleActivityItemProps = ComponentPropsWithRef<'li'> & {
	icon?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	time?: ReactNode;
};

export function ConsoleActivityItem({ icon, title, description, time, className, ...props }: ConsoleActivityItemProps) {
	return (
		<li className={cn('flex items-start gap-3 py-3', className)} {...props}>
			{icon ? (
				<span className='text-base-content/45 mt-0.5 grid size-7 shrink-0 place-items-center'>{icon}</span>
			) : null}
			<div className='min-w-0 flex-1'>
				<div className='truncate text-sm font-medium'>{title}</div>
				{description ? <div className='text-base-content/65 mt-0.5 text-xs'>{description}</div> : null}
			</div>
			{time ? <time className='text-base-content/65 shrink-0 text-xs'>{time}</time> : null}
		</li>
	);
}
