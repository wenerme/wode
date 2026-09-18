'use client';

import { Component, LayoutDashboard, type Monitor, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { ConsoleDisplayDensity, ConsoleDisplayRadius } from './console-theme';
import type { ConsoleThemeColorScheme, ConsoleThemeOption } from './console-theme-catalog';
import {
	ConsoleThemeComponentPreview,
	type ConsoleThemePreviewSize,
	type ConsoleThemePreviewTone,
} from './console-theme-component-preview';
import { ConsoleThemeDemo } from './console-theme-preview';

export type ConsoleDisplayPreviewMode = 'console' | 'components';

export function SettingsField({
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
			{description ? <div className='text-base-content/65 mt-1.5 text-xs leading-5'>{description}</div> : null}
		</fieldset>
	);
}

export function SegmentedRadioGroup<Value extends string>({
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

export function ThemeSlotOption({
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
				'border-base-300 hover:bg-base-200/55 focus-within:ring-primary flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-3 text-left outline-none focus-within:ring-2',
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

const previewModeOptions = [
	{ value: 'console', label: 'Console', icon: LayoutDashboard },
	{ value: 'components', label: 'Components', icon: Component },
] satisfies ReadonlyArray<{ value: ConsoleDisplayPreviewMode; label: string; icon: typeof Component }>;

export function ConsoleDisplaySettingsPreview({
	theme,
	editingScheme,
	appliedTheme,
	previewMode,
	previewSize,
	previewTone,
	density,
	radius,
	radiusLabel,
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
	radiusLabel: string;
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
				<PreviewFact label='控件圆角' value={radiusLabel} />
				<PreviewFact label='页面动效' value={motionReduced ? '减少' : '完整'} />
			</dl>
		</div>
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
