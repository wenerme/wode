'use client';

import { Monitor, Moon, RotateCcw, Sun, Zap, ZapOff } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';
import {
	type ConsoleDisplayPreviewMode,
	ConsoleDisplaySettingsPreview,
	SegmentedRadioGroup,
	SettingsField,
	ThemeSlotOption,
} from './console-display-controls';
import {
	ConsoleDisplaySettingsHeader,
	type ConsoleDisplaySettingsHeadingLevel,
	ConsoleDisplaySettingsLayout,
	headingTag,
} from './console-display-layout';
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
	getConsoleThemesByColorScheme,
} from './console-theme-catalog';
import { ConsoleThemeCatalog } from './console-theme-catalog-view';
import type { ConsoleThemePreviewSize, ConsoleThemePreviewTone } from './console-theme-component-preview';

export type { ConsoleDisplayPreviewMode } from './console-display-controls';
export {
	ConsoleDisplaySettingsHeader,
	type ConsoleDisplaySettingsHeaderProps,
	type ConsoleDisplaySettingsHeadingLevel,
	ConsoleDisplaySettingsLayout,
	type ConsoleDisplaySettingsLayoutProps,
} from './console-display-layout';
export { ConsoleThemeCatalog, type ConsoleThemeCatalogProps } from './console-theme-catalog-view';

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
			radiusLabel={radiusOptions.find((item) => item.value === settings.radius)?.label ?? settings.radius}
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
