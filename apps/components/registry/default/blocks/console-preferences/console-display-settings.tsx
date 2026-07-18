'use client';

import {
	ChevronDown,
	Component,
	LayoutDashboard,
	Monitor,
	Moon,
	Palette,
	RotateCcw,
	Search,
	Sparkles,
	Sun,
	X,
	Zap,
	ZapOff,
} from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Children, useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import {
	type ConsoleDisplayDensity,
	type ConsoleDisplayRadius,
	type ConsoleMotionPreference,
	type ConsoleThemeMode,
	useConsoleDisplaySettings,
} from './console-theme';
import {
	type ConsoleThemeColorScheme,
	type ConsoleThemeOption,
	defaultConsoleThemeOptions,
	filterConsoleThemeOptions,
	getConsoleThemesByColorScheme,
} from './console-theme-catalog';
import {
	ConsoleThemeComponentPreview,
	type ConsoleThemePreviewSize,
	type ConsoleThemePreviewTone,
} from './console-theme-component-preview';
import { ConsoleThemeDemo, ConsoleThemePreviewCard } from './console-theme-preview';

export type ConsoleDisplaySettingsHeadingLevel = 2 | 3 | 4 | 5 | 6;
export type ConsoleDisplayPreviewMode = 'console' | 'components';

const headingTag: Record<ConsoleDisplaySettingsHeadingLevel, `h${ConsoleDisplaySettingsHeadingLevel}`> = {
	2: 'h2',
	3: 'h3',
	4: 'h4',
	5: 'h5',
	6: 'h6',
};

function hasRenderableNode(value: ReactNode) {
	return Children.toArray(value).length > 0;
}

export type ConsoleDisplaySettingsLayoutProps = ComponentPropsWithRef<'div'> & {
	preview?: ReactNode;
	contentClassName?: string;
	previewClassName?: string;
};

export function ConsoleDisplaySettingsLayout({
	preview,
	contentClassName,
	previewClassName,
	children,
	className,
	...props
}: ConsoleDisplaySettingsLayoutProps) {
	return (
		<div
			data-console-density=''
			className={cn(
				'border-base-300 bg-base-100 grid min-w-0 overflow-hidden border xl:grid-cols-[minmax(0,1fr)_23rem]',
				className,
			)}
			{...props}
		>
			<div className={cn('min-w-0 p-4 md:p-5', contentClassName)}>{children}</div>
			{hasRenderableNode(preview) ? (
				<aside
					aria-label='显示设置预览'
					className={cn(
						'border-base-300 bg-base-200/45 hidden border-t p-4 xl:block xl:border-t-0 xl:border-l',
						previewClassName,
					)}
				>
					<div className='sticky top-4'>{preview}</div>
				</aside>
			) : null}
		</div>
	);
}

export type ConsoleDisplaySettingsHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	title?: string;
	description?: ReactNode;
	actions?: ReactNode;
	headingLevel?: ConsoleDisplaySettingsHeadingLevel;
};

export function ConsoleDisplaySettingsHeader({
	title = '显示设置',
	description,
	actions,
	headingLevel = 2,
	className,
	...props
}: ConsoleDisplaySettingsHeaderProps) {
	const Heading = headingTag[headingLevel];
	return (
		<header
			className={cn('border-base-300 flex items-start justify-between gap-3 border-b pb-4', className)}
			{...props}
		>
			<div className='min-w-0'>
				{title ? (
					<Heading className='flex items-center gap-2 text-sm font-semibold'>
						<Palette className='text-primary size-4 shrink-0' />
						{title}
					</Heading>
				) : null}
				{hasRenderableNode(description) ? (
					<div className='text-base-content/65 mt-1 text-xs leading-5'>{description}</div>
				) : null}
			</div>
			{hasRenderableNode(actions) ? <div className='flex shrink-0 flex-wrap items-center gap-1'>{actions}</div> : null}
		</header>
	);
}

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
	const defaultAriaLabel = title.trim() || '主题目录';

	return (
		<section aria-label={ariaLabel ?? defaultAriaLabel} className={cn('min-w-0', className)} {...props}>
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

export type ConsoleDisplaySettingsPanelProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> & {
	storageKey?: string;
	themeOptions?: readonly ConsoleThemeOption[];
	title?: string;
	description?: ReactNode;
	actions?: ReactNode;
	headingLevel?: ConsoleDisplaySettingsHeadingLevel;
};

const densityOptions: Array<{ value: ConsoleDisplayDensity; label: string }> = [
	{ value: 'comfortable', label: '舒适' },
	{ value: 'compact', label: '紧凑' },
];

const radiusOptions: Array<{ value: ConsoleDisplayRadius; label: string }> = [
	{ value: 'square', label: '直角' },
	{ value: 'soft', label: '柔和' },
	{ value: 'rounded', label: '圆润' },
];

const themeModeOptions: Array<{ value: ConsoleThemeMode; label: string; icon: typeof Monitor }> = [
	{ value: 'system', label: '跟随系统', icon: Monitor },
	{ value: 'light', label: '始终亮色', icon: Sun },
	{ value: 'dark', label: '始终暗色', icon: Moon },
];

const motionOptions: Array<{ value: ConsoleMotionPreference; label: string; icon: typeof Monitor }> = [
	{ value: 'system', label: '跟随系统', icon: Monitor },
	{ value: 'reduced', label: '减少动效', icon: ZapOff },
	{ value: 'full', label: '完整动效', icon: Zap },
];

const previewModeOptions: Array<{ value: ConsoleDisplayPreviewMode; label: string; icon: typeof Component }> = [
	{ value: 'console', label: 'Console', icon: LayoutDashboard },
	{ value: 'components', label: 'Components', icon: Component },
];

export function ConsoleDisplaySettingsPanel({
	storageKey,
	themeOptions = defaultConsoleThemeOptions,
	title = '显示设置',
	description = '主题映射、界面尺度与动效偏好保存在当前浏览器。',
	actions,
	headingLevel = 2,
	className,
	...props
}: ConsoleDisplaySettingsPanelProps) {
	const { settings, systemDark, systemReducedMotion, motionReduced, resolvedTheme, update, reset } =
		useConsoleDisplaySettings({ storageKey, themeOptions });
	const [editingScheme, setEditingScheme] = useState<ConsoleThemeColorScheme>('light');
	const [themeQuery, setThemeQuery] = useState('');
	const [previewMode, setPreviewMode] = useState<ConsoleDisplayPreviewMode>('console');
	const [previewSize, setPreviewSize] = useState<ConsoleThemePreviewSize>('sm');
	const [previewTone, setPreviewTone] = useState<ConsoleThemePreviewTone>('primary');
	const groupId = useId();
	const sectionHeadingLevel = Math.min(6, headingLevel + 1) as ConsoleDisplaySettingsHeadingLevel;
	const SectionHeading = headingTag[sectionHeadingLevel];
	const lightThemes = getConsoleThemesByColorScheme(themeOptions, 'light');
	const darkThemes = getConsoleThemesByColorScheme(themeOptions, 'dark');
	const catalogThemes = editingScheme === 'light' ? lightThemes : darkThemes;
	const selectedTheme = editingScheme === 'light' ? settings.lightTheme : settings.darkTheme;
	const customTheme = themeOptions.some((theme) => theme.value === selectedTheme)
		? undefined
		: ({
				value: selectedTheme,
				label: selectedTheme,
				colorScheme: editingScheme,
				description: '自定义主题',
			} satisfies ConsoleThemeOption);
	const visibleThemes = customTheme ? [customTheme, ...catalogThemes] : catalogThemes;
	const lightTheme = getThemeOption(themeOptions, settings.lightTheme, 'light');
	const darkTheme = getThemeOption(themeOptions, settings.darkTheme, 'dark');
	const editingTheme = editingScheme === 'light' ? lightTheme : darkTheme;

	useEffect(() => {
		if (settings.themeMode !== 'system') setEditingScheme(settings.themeMode);
	}, [settings.themeMode]);

	const setThemeMode = (themeMode: ConsoleThemeMode) => {
		update({ themeMode });
		if (themeMode !== 'system') setEditingScheme(themeMode);
	};
	const setTheme = (theme: ConsoleThemeOption) => {
		if (editingScheme === 'light') update({ lightTheme: theme.value });
		else update({ darkTheme: theme.value });
	};
	const preview = (
		<ConsoleDisplaySettingsPreview
			theme={editingTheme}
			editingScheme={editingScheme}
			appliedTheme={resolvedTheme.option}
			previewMode={previewMode}
			previewSize={previewSize}
			previewTone={previewTone}
			density={settings.density}
			radius={settings.radius}
			motionReduced={motionReduced}
			onPreviewModeChange={setPreviewMode}
			onPreviewSizeChange={setPreviewSize}
			onPreviewToneChange={setPreviewTone}
		/>
	);

	return (
		<ConsoleDisplaySettingsLayout className={className} preview={preview} {...props}>
			<ConsoleDisplaySettingsHeader
				title={title}
				description={description}
				headingLevel={headingLevel}
				actions={
					<>
						{actions}
						<button
							type='button'
							title='恢复默认设置'
							className='hover:bg-base-200 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs'
							onClick={reset}
						>
							<RotateCcw className='size-3.5' />
							重置
						</button>
					</>
				}
			/>

			<section aria-labelledby={`${groupId}-display-title`} className='mt-5'>
				<SectionHeading id={`${groupId}-display-title`} className='text-sm font-medium'>
					界面偏好
				</SectionHeading>
				<div className='mt-3 grid gap-5 lg:grid-cols-2'>
					<SettingsField
						label='配色模式'
						description={
							settings.themeMode === 'system'
								? `系统当前使用${systemDark ? '暗色' : '亮色'}配色`
								: settings.themeMode === 'dark'
									? '固定使用暗色主题'
									: '固定使用亮色主题'
						}
					>
						<SegmentedRadioGroup
							name={`${groupId}-theme-mode`}
							ariaLabel='配色模式'
							value={settings.themeMode}
							options={themeModeOptions}
							onValueChange={setThemeMode}
						/>
					</SettingsField>
					<SettingsField
						label='动效偏好'
						description={
							settings.motion === 'system'
								? `系统当前${systemReducedMotion ? '减少动效' : '使用完整动效'}`
								: motionReduced
									? '已减少页面与组件动效'
									: '使用完整页面与组件动效'
						}
					>
						<SegmentedRadioGroup
							name={`${groupId}-motion`}
							ariaLabel='动效偏好'
							value={settings.motion}
							options={motionOptions}
							onValueChange={(motion) => update({ motion })}
						/>
					</SettingsField>
					<SettingsField
						label='界面密度'
						description={settings.density === 'compact' ? '适合高频扫描与批量操作' : '适合常规浏览与触控操作'}
					>
						<SegmentedRadioGroup
							name={`${groupId}-density`}
							ariaLabel='界面密度'
							value={settings.density}
							options={densityOptions}
							onValueChange={(density) => update({ density })}
						/>
					</SettingsField>
					<SettingsField label='控件圆角' description='影响面板、输入框和选择控件的轮廓'>
						<SegmentedRadioGroup
							name={`${groupId}-radius`}
							ariaLabel='控件圆角'
							value={settings.radius}
							options={radiusOptions}
							onValueChange={(radius) => update({ radius })}
						/>
					</SettingsField>
				</div>
			</section>

			<section className='border-base-300 mt-6 border-t pt-5'>
				<div className='flex flex-wrap items-end justify-between gap-2'>
					<div>
						<SectionHeading className='text-sm font-medium'>主题映射</SectionHeading>
						<p className='text-base-content/65 mt-1 text-xs'>分别设置系统亮色与暗色状态使用的主题。</p>
					</div>
					<span className='text-base-content/65 text-xs'>当前应用：{resolvedTheme.option.label}</span>
				</div>
				<div className='mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2' role='radiogroup' aria-label='正在编辑的主题映射'>
					<ThemeSlotOption
						name={`${groupId}-editing-scheme`}
						value='light'
						label='亮色主题'
						theme={lightTheme}
						checked={editingScheme === 'light'}
						icon={<Sun className='size-4' />}
						onChange={() => setEditingScheme('light')}
					/>
					<ThemeSlotOption
						name={`${groupId}-editing-scheme`}
						value='dark'
						label='暗色主题'
						theme={darkTheme}
						checked={editingScheme === 'dark'}
						icon={<Moon className='size-4' />}
						onChange={() => setEditingScheme('dark')}
					/>
				</div>
			</section>

			<ConsoleThemeCatalog
				className='border-base-300 mt-6 border-t pt-5'
				title={editingScheme === 'light' ? '选择亮色主题' : '选择暗色主题'}
				headingLevel={sectionHeadingLevel}
				themes={visibleThemes}
				selectedTheme={selectedTheme}
				collapsedCount={8}
				query={themeQuery}
				radioName={`${groupId}-${editingScheme}-theme`}
				onQueryChange={setThemeQuery}
				onThemeSelect={setTheme}
			/>
			<div className='border-base-300 mt-6 border-t pt-5 xl:hidden'>{preview}</div>
		</ConsoleDisplaySettingsLayout>
	);
}

function ConsoleDisplaySettingsPreview({
	theme,
	editingScheme,
	appliedTheme,
	previewMode,
	previewSize,
	previewTone,
	density,
	radius,
	motionReduced,
	onPreviewModeChange,
	onPreviewSizeChange,
	onPreviewToneChange,
}: {
	theme: ConsoleThemeOption;
	editingScheme: ConsoleThemeColorScheme;
	appliedTheme: ConsoleThemeOption;
	previewMode: ConsoleDisplayPreviewMode;
	previewSize: ConsoleThemePreviewSize;
	previewTone: ConsoleThemePreviewTone;
	density: ConsoleDisplayDensity;
	radius: ConsoleDisplayRadius;
	motionReduced: boolean;
	onPreviewModeChange: (mode: ConsoleDisplayPreviewMode) => void;
	onPreviewSizeChange: (size: ConsoleThemePreviewSize) => void;
	onPreviewToneChange: (tone: ConsoleThemePreviewTone) => void;
}) {
	const id = useId();
	return (
		<div className='min-w-0'>
			<div className='flex items-start gap-2'>
				<Sparkles className='text-primary mt-0.5 size-4 shrink-0' />
				<div className='min-w-0 flex-1'>
					<div className='text-sm font-semibold'>主题预览</div>
					<div className='text-base-content/65 mt-0.5 text-xs'>
						正在编辑{editingScheme === 'dark' ? '暗色' : '亮色'} · {theme.label}
					</div>
				</div>
			</div>
			<div className='mt-3'>
				<SegmentedRadioGroup
					name={`${id}-preview-mode`}
					ariaLabel='预览类型'
					value={previewMode}
					options={previewModeOptions}
					onValueChange={onPreviewModeChange}
				/>
			</div>
			{previewMode === 'components' ? (
				<ConsoleThemeComponentPreview
					className='mt-3'
					theme={theme}
					size={previewSize}
					tone={previewTone}
					density={density}
					radius={radius}
					onSizeChange={onPreviewSizeChange}
					onToneChange={onPreviewToneChange}
				/>
			) : (
				<ConsoleThemeDemo className='mt-3' theme={theme} density={density} radius={radius} />
			)}
			<dl className='border-base-300 divide-base-300 mt-4 divide-y border-y text-xs'>
				<PreviewFact label='当前应用' value={appliedTheme.label} />
				<PreviewFact label='界面密度' value={density === 'compact' ? '紧凑' : '舒适'} />
				<PreviewFact label='控件圆角' value={radiusOptions.find((item) => item.value === radius)?.label ?? radius} />
				<PreviewFact label='页面动效' value={motionReduced ? '减少' : '完整'} />
			</dl>
		</div>
	);
}

function SettingsField({
	label,
	description,
	children,
}: {
	label: ReactNode;
	description?: ReactNode;
	children: ReactNode;
}) {
	return (
		<fieldset className='min-w-0'>
			<legend className='text-xs font-medium'>{label}</legend>
			<div className='mt-2'>{children}</div>
			{hasRenderableNode(description) ? (
				<div className='text-base-content/65 mt-1.5 text-xs leading-5'>{description}</div>
			) : null}
		</fieldset>
	);
}

function SegmentedRadioGroup<Value extends string>({
	name,
	value,
	options,
	ariaLabel,
	onValueChange,
}: {
	name: string;
	value: Value;
	options: ReadonlyArray<{ value: Value; label: string; icon?: typeof Monitor }>;
	ariaLabel?: string;
	onValueChange: (value: Value) => void;
}) {
	const columnClass = options.length === 2 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-1';
	return (
		<div
			role='radiogroup'
			aria-label={ariaLabel}
			className={cn('border-base-300 bg-base-200/45 grid min-h-9 border p-0.5', columnClass)}
		>
			{options.map((option) => {
				const Icon = option.icon;
				return (
					<label
						key={option.value}
						className={cn(
							'focus-within:ring-primary flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-2 text-xs focus-within:ring-2',
							value === option.value
								? 'bg-base-100 font-medium shadow-sm'
								: 'text-base-content/65 hover:text-base-content',
						)}
					>
						<input
							type='radio'
							name={name}
							value={option.value}
							checked={value === option.value}
							className='sr-only'
							onChange={() => onValueChange(option.value)}
						/>
						{Icon ? <Icon className='size-3.5 shrink-0' /> : null}
						<span className='truncate'>{option.label}</span>
					</label>
				);
			})}
		</div>
	);
}

function ThemeSlotOption({
	name,
	value,
	label,
	theme,
	checked,
	icon,
	onChange,
}: {
	name: string;
	value: ConsoleThemeColorScheme;
	label: string;
	theme: ConsoleThemeOption;
	checked: boolean;
	icon: ReactNode;
	onChange: () => void;
}) {
	return (
		<label
			className={cn(
				'border-base-300 flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-3 text-left outline-none',
				'hover:bg-base-200/55 focus-within:ring-primary focus-within:ring-2',
				checked && 'border-primary bg-primary/8',
			)}
		>
			<input type='radio' name={name} value={value} checked={checked} className='sr-only' onChange={onChange} />
			<span className='bg-base-200 grid size-8 shrink-0 place-items-center rounded-md'>{icon}</span>
			<span className='min-w-0 flex-1'>
				<span className='block text-xs font-medium'>{label}</span>
				<span className='text-base-content/65 block truncate text-[11px]'>{theme.label}</span>
			</span>
		</label>
	);
}

function PreviewFact({ label, value }: { label: ReactNode; value: ReactNode }) {
	return (
		<div className='grid grid-cols-[5rem_minmax(0,1fr)] gap-2 py-2.5'>
			<dt className='text-base-content/65'>{label}</dt>
			<dd className='truncate font-medium'>{value}</dd>
		</div>
	);
}

function getThemeOption(
	themeOptions: readonly ConsoleThemeOption[],
	value: string,
	colorScheme: ConsoleThemeColorScheme,
): ConsoleThemeOption {
	return (
		themeOptions.find((theme) => theme.value === value && theme.colorScheme === colorScheme) ?? {
			value,
			label: value,
			colorScheme,
			description: '自定义主题',
		}
	);
}
