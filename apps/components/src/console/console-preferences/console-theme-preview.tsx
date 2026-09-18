'use client';

import { Bell, Check, Command, Database, LayoutGrid, Moon, PanelRight, Search, Settings, Sun } from 'lucide-react';
import type { ComponentPropsWithRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { ConsoleDisplayDensity, ConsoleDisplayRadius } from './console-theme';
import type { ConsoleThemeOption } from './console-theme-catalog';

type ConsoleThemePreviewStyle = CSSProperties & {
	'--radius-box'?: string;
	'--radius-field'?: string;
	'--radius-selector'?: string;
};

const consoleThemePreviewRadiusStyle: Record<ConsoleDisplayRadius, ConsoleThemePreviewStyle> = {
	square: {
		'--radius-box': '0.125rem',
		'--radius-field': '0.125rem',
		'--radius-selector': '0.125rem',
	},
	soft: {
		'--radius-box': '0.5rem',
		'--radius-field': '0.25rem',
		'--radius-selector': '0.5rem',
	},
	rounded: {
		'--radius-box': '0.75rem',
		'--radius-field': '0.5rem',
		'--radius-selector': '0.75rem',
	},
};

export function getConsoleThemePreviewStyle(radius: ConsoleDisplayRadius, style?: CSSProperties) {
	return { ...consoleThemePreviewRadiusStyle[radius], ...style } satisfies ConsoleThemePreviewStyle;
}

export type ConsoleThemePreviewCardProps = Omit<ComponentPropsWithRef<'label'>, 'onChange' | 'onSelect'> & {
	theme: ConsoleThemeOption;
	selected?: boolean;
	name?: string;
	onThemeSelect?: (theme: ConsoleThemeOption) => void;
};

export function ConsoleThemePreviewCard({
	theme,
	selected,
	name = 'console-theme',
	onThemeSelect,
	className,
	...props
}: ConsoleThemePreviewCardProps) {
	return (
		<label
			data-theme={theme.value}
			className={cn(
				'bg-base-100 text-base-content relative block min-w-0 cursor-pointer overflow-hidden border text-left outline-none',
				'hover:border-primary focus-within:ring-primary rounded-md transition-colors focus-within:ring-2',
				selected ? 'border-primary ring-primary/35 ring-1' : 'border-base-300',
				className,
			)}
			{...props}
		>
			<input
				type='radio'
				name={name}
				value={theme.value}
				checked={selected}
				className='sr-only'
				aria-label={`选择 ${theme.label} 主题`}
				onChange={() => onThemeSelect?.(theme)}
			/>
			<span className='border-base-300 flex min-h-9 items-center gap-2 border-b px-2.5 py-1.5'>
				<span className='min-w-0 flex-1'>
					<span className='block truncate text-xs font-semibold'>{theme.label}</span>
					<span className='text-base-content block truncate text-[10px]'>{theme.value}</span>
				</span>
				<span className='badge badge-ghost badge-xs'>{theme.colorScheme === 'dark' ? 'Dark' : 'Light'}</span>
				{selected ? <Check className='text-primary size-3.5 shrink-0' /> : null}
			</span>
			<span aria-hidden='true' className='bg-base-200 grid min-h-28 grid-cols-[2.25rem_minmax(0,1fr)]'>
				<span className='bg-base-300 flex flex-col items-center gap-1.5 p-1.5' aria-hidden>
					<span className='bg-primary size-4 rounded-sm' />
					<span className='bg-secondary size-4 rounded-sm' />
					<span className='bg-accent size-4 rounded-sm' />
				</span>
				<span className='bg-base-100 flex min-w-0 flex-col gap-2 p-2'>
					<span className='flex items-center gap-1.5'>
						<span className='btn btn-primary btn-xs pointer-events-none h-6 min-h-6 px-2 text-[9px]'>主要</span>
						<span className='badge badge-success badge-xs'>正常</span>
					</span>
					<span className='input input-xs border-base-300 pointer-events-none flex h-7 min-h-7 w-full items-center text-[9px]'>
						搜索资源
					</span>
					<span className='flex items-center gap-2'>
						<progress className='progress progress-primary h-1.5 min-w-0 flex-1' value='68' max='100' />
						<span aria-hidden className='border-primary bg-primary relative h-4 w-7 shrink-0 rounded-full border'>
							<span className='bg-primary-content absolute top-0.5 right-0.5 size-2.5 rounded-full' />
						</span>
					</span>
				</span>
			</span>
		</label>
	);
}

export type ConsoleThemeDemoProps = ComponentPropsWithRef<'div'> & {
	theme: ConsoleThemeOption;
	density?: ConsoleDisplayDensity;
	radius?: ConsoleDisplayRadius;
};

export function ConsoleThemeDemo({
	theme,
	density = 'comfortable',
	radius = 'soft',
	className,
	style,
	...props
}: ConsoleThemeDemoProps) {
	const compact = density === 'compact';
	return (
		<div
			inert
			aria-hidden='true'
			data-slot='console-theme-demo'
			data-theme={theme.value}
			data-density={density}
			data-radius={radius}
			className={cn(
				'border-base-300 bg-base-200 text-base-content grid grid-cols-[2.25rem_minmax(0,1fr)_2.75rem] overflow-hidden rounded-md border shadow-sm',
				compact ? 'min-h-64' : 'min-h-72',
				className,
			)}
			style={getConsoleThemePreviewStyle(radius, style)}
			{...props}
		>
			<nav
				aria-label='主题预览全局导航'
				className='border-base-300 bg-base-100 flex flex-col items-center gap-1 border-r py-2'
			>
				<span className='bg-neutral text-neutral-content grid size-7 place-items-center rounded-sm'>
					<Command className='size-3.5' />
				</span>
				<span className='bg-base-200 text-base-content grid size-7 place-items-center rounded-sm' aria-hidden>
					<LayoutGrid className='size-3.5' />
				</span>
				<span className='text-primary grid size-7 place-items-center rounded-sm' aria-hidden>
					<Database className='size-3.5' />
				</span>
			</nav>

			<div className='flex min-w-0 flex-col'>
				<header
					className={cn(
						'border-base-300 bg-base-100 flex shrink-0 items-center gap-2 border-b px-2.5',
						compact ? 'h-9' : 'h-11',
					)}
				>
					<span className='min-w-0 flex-1 truncate text-xs font-semibold'>资源目录</span>
					<span className='badge badge-ghost badge-xs'>{density === 'compact' ? 'Compact' : 'Comfortable'}</span>
				</header>
				<div className={cn('flex min-h-0 flex-1 flex-col', compact ? 'gap-1.5 p-2' : 'gap-2 p-2.5')}>
					<div className='flex items-center gap-2'>
						<span className='min-w-0 flex-1 truncate text-[11px] font-semibold'>{theme.label}</span>
						<span className='badge badge-primary badge-xs'>{theme.value}</span>
					</div>
					<div className='join flex w-full'>
						<label className='input input-xs join-item flex min-w-0 flex-1 items-center gap-1.5'>
							<Search className='size-3 shrink-0' />
							<input className='min-w-0' aria-label='主题预览搜索' placeholder='搜索资源' readOnly />
						</label>
						<button type='button' className='btn btn-primary btn-xs join-item px-2'>
							查询
						</button>
					</div>
					<div className='border-base-300 bg-base-100 divide-base-300 divide-y overflow-hidden rounded-sm border'>
						{[
							['core-postgres', '正常', 'badge-success'],
							['session-cache', '正常', 'badge-success'],
							['audit-archive', '关注', 'badge-warning'],
						].map(([label, value, badge]) => (
							<div key={label} className='flex min-w-0 items-center gap-1.5 px-2 py-1.5 text-[10px]'>
								<span className='min-w-0 flex-1 truncate'>{label}</span>
								<span className={cn('badge badge-xs', badge)}>{value}</span>
							</div>
						))}
					</div>
					<div className='mt-auto flex items-center gap-2'>
						<progress className='progress progress-primary h-1.5 min-w-0 flex-1' value='72' max='100' />
						<span className='text-base-content text-[10px]'>72%</span>
					</div>
				</div>
			</div>

			<aside
				aria-label='主题预览工具坞'
				className='border-base-300 bg-base-100 flex flex-col items-center gap-1 border-l py-2'
			>
				<span className='avatar placeholder relative mb-1' title='Wener'>
					<span className='bg-neutral text-neutral-content grid size-7 place-items-center rounded-full text-[9px] font-semibold'>
						WN
					</span>
					<span className='border-base-100 bg-success absolute right-0 bottom-0 size-2 rounded-full border' />
				</span>
				<span className='bg-base-200 grid size-7 place-items-center rounded-sm' aria-hidden>
					<PanelRight className='size-3.5' />
				</span>
				<span className='grid size-7 place-items-center rounded-sm' aria-hidden>
					<Bell className='size-3.5' />
				</span>
				<span className='flex-1' />
				<span className='grid size-7 place-items-center rounded-sm' aria-hidden>
					<Settings className='size-3.5' />
				</span>
				<span className='bg-primary text-primary-content grid size-7 place-items-center rounded-sm' aria-hidden>
					{theme.colorScheme === 'dark' ? <Moon className='size-3.5' /> : <Sun className='size-3.5' />}
				</span>
			</aside>
		</div>
	);
}
