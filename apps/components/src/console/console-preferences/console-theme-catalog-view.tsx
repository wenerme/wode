'use client';

import { ChevronDown, Search, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { type ConsoleDisplaySettingsHeadingLevel, headingTag } from './console-display-layout';
import type { ConsoleThemeOption } from './console-theme-catalog';
import { filterConsoleThemeOptions } from './console-theme-catalog';
import { ConsoleThemePreviewCard } from './console-theme-preview';

export type ConsoleThemeCatalogProps = Omit<ComponentPropsWithRef<'section'>, 'title' | 'onChange'> & {
	themes: readonly ConsoleThemeOption[];
	selectedTheme?: string;
	query?: string;
	title?: string;
	empty?: ReactNode;
	radioName?: string;
	headingLevel?: ConsoleDisplaySettingsHeadingLevel;
	collapsedCount?: number;
	defaultExpanded?: boolean;
	onQueryChange?: (query: string) => void;
	onThemeSelect?: (theme: ConsoleThemeOption) => void;
};

export function ConsoleThemeCatalog({
	themes,
	selectedTheme,
	query = '',
	title = '选择主题',
	empty = '没有匹配的主题',
	radioName,
	headingLevel = 3,
	collapsedCount,
	defaultExpanded = false,
	onQueryChange,
	onThemeSelect,
	className,
	'aria-label': ariaLabel,
	...props
}: ConsoleThemeCatalogProps) {
	const generatedRadioName = useId();
	const Heading = headingTag[headingLevel];
	const [expanded, setExpanded] = useState(defaultExpanded);
	const filteredThemes = filterConsoleThemeOptions(themes, query);
	const prioritizedThemes = selectedTheme
		? [
				...filteredThemes.filter((theme) => theme.value === selectedTheme),
				...filteredThemes.filter((theme) => theme.value !== selectedTheme),
			]
		: filteredThemes;
	const safeCollapsedCount = collapsedCount === undefined ? undefined : Math.max(1, Math.floor(collapsedCount));
	const canCollapse =
		query.trim().length === 0 && safeCollapsedCount !== undefined && filteredThemes.length > safeCollapsedCount;
	const visibleThemes = canCollapse && !expanded ? prioritizedThemes.slice(0, safeCollapsedCount) : filteredThemes;

	return (
		<section aria-label={ariaLabel ?? (title.trim() || '主题目录')} className={cn('min-w-0', className)} {...props}>
			<div className='flex flex-wrap items-end justify-between gap-2'>
				<div className='min-w-0'>
					{title ? <Heading className='text-sm font-medium'>{title}</Heading> : null}
					<div className='text-base-content/65 mt-1 text-xs'>
						{filteredThemes.length} / {themes.length} 个主题
					</div>
				</div>
				<label className='border-base-300 bg-base-100 flex h-9 min-w-52 flex-1 items-center gap-2 rounded-md border px-2 sm:max-w-72'>
					<Search aria-hidden='true' className='text-base-content/45 size-4 shrink-0' />
					<input
						aria-label='搜索主题'
						value={query}
						placeholder='名称、标识或说明'
						className='placeholder:text-base-content/65 min-w-0 flex-1 bg-transparent text-xs outline-none'
						onChange={(event) => onQueryChange?.(event.target.value)}
					/>
					{query ? (
						<button
							type='button'
							aria-label='清除主题搜索'
							title='清除搜索'
							className='hover:bg-base-200 grid size-6 shrink-0 place-items-center rounded-sm'
							onClick={() => onQueryChange?.('')}
						>
							<X className='size-3.5' />
						</button>
					) : null}
				</label>
			</div>
			{visibleThemes.length ? (
				<>
					<div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3'>
						{visibleThemes.map((theme) => (
							<ConsoleThemePreviewCard
								key={theme.value}
								theme={theme}
								name={radioName ?? generatedRadioName}
								selected={selectedTheme === theme.value}
								onThemeSelect={onThemeSelect}
							/>
						))}
					</div>
					{canCollapse ? (
						<button
							type='button'
							aria-expanded={expanded}
							className='border-base-300 hover:bg-base-200/45 mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md border text-xs'
							onClick={() => setExpanded((value) => !value)}
						>
							<ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
							{expanded ? '收起主题' : `显示全部 ${filteredThemes.length} 个主题`}
						</button>
					) : null}
				</>
			) : (
				<div className='bg-base-200/45 text-base-content/65 mt-3 rounded-md px-3 py-8 text-center text-sm'>{empty}</div>
			)}
		</section>
	);
}
