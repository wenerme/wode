'use client';

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { ConsoleDisplayDensity, ConsoleDisplayRadius } from './console-theme';
import type { ConsoleThemeOption } from './console-theme-catalog';
import { getConsoleThemePreviewStyle } from './console-theme-preview';

export type ConsoleThemePreviewSize = 'xs' | 'sm' | 'md' | 'lg';
export type ConsoleThemePreviewTone =
	| 'neutral'
	| 'primary'
	| 'secondary'
	| 'accent'
	| 'info'
	| 'success'
	| 'warning'
	| 'error';

const sizeOptions: Array<{ value: ConsoleThemePreviewSize; label: string }> = [
	{ value: 'xs', label: 'XS' },
	{ value: 'sm', label: 'SM' },
	{ value: 'md', label: 'MD' },
	{ value: 'lg', label: 'LG' },
];

const toneOptions: Array<{ value: ConsoleThemePreviewTone; label: string }> = [
	{ value: 'neutral', label: 'Neutral' },
	{ value: 'primary', label: 'Primary' },
	{ value: 'secondary', label: 'Secondary' },
	{ value: 'accent', label: 'Accent' },
	{ value: 'info', label: 'Info' },
	{ value: 'success', label: 'Success' },
	{ value: 'warning', label: 'Warning' },
	{ value: 'error', label: 'Error' },
];

const previewSizeClass: Record<
	ConsoleThemePreviewSize,
	{ button: string; badge: string; input: string; checkbox: string; radio: string; toggle: string }
> = {
	xs: {
		button: 'btn-xs',
		badge: 'badge-xs',
		input: 'input-xs',
		checkbox: 'checkbox-xs',
		radio: 'radio-xs',
		toggle: 'toggle-xs',
	},
	sm: {
		button: 'btn-sm',
		badge: 'badge-sm',
		input: 'input-sm',
		checkbox: 'checkbox-sm',
		radio: 'radio-sm',
		toggle: 'toggle-sm',
	},
	md: {
		button: 'btn-md',
		badge: 'badge-md',
		input: 'input-md',
		checkbox: 'checkbox-md',
		radio: 'radio-md',
		toggle: 'toggle-md',
	},
	lg: {
		button: 'btn-lg',
		badge: 'badge-lg',
		input: 'input-lg',
		checkbox: 'checkbox-lg',
		radio: 'radio-lg',
		toggle: 'toggle-lg',
	},
};

const previewToneClass: Record<
	ConsoleThemePreviewTone,
	{ button: string; badge: string; checkbox: string; radio: string; toggle: string; progress: string }
> = {
	neutral: {
		button: 'btn-neutral',
		badge: 'badge-neutral',
		checkbox: 'checkbox-neutral',
		radio: 'radio-neutral',
		toggle: 'toggle-neutral',
		progress: 'progress-neutral',
	},
	primary: {
		button: 'btn-primary',
		badge: 'badge-primary',
		checkbox: 'checkbox-primary',
		radio: 'radio-primary',
		toggle: 'toggle-primary',
		progress: 'progress-primary',
	},
	secondary: {
		button: 'btn-secondary',
		badge: 'badge-secondary',
		checkbox: 'checkbox-secondary',
		radio: 'radio-secondary',
		toggle: 'toggle-secondary',
		progress: 'progress-secondary',
	},
	accent: {
		button: 'btn-accent',
		badge: 'badge-accent',
		checkbox: 'checkbox-accent',
		radio: 'radio-accent',
		toggle: 'toggle-accent',
		progress: 'progress-accent',
	},
	info: {
		button: 'btn-info',
		badge: 'badge-info',
		checkbox: 'checkbox-info',
		radio: 'radio-info',
		toggle: 'toggle-info',
		progress: 'progress-info',
	},
	success: {
		button: 'btn-success',
		badge: 'badge-success',
		checkbox: 'checkbox-success',
		radio: 'radio-success',
		toggle: 'toggle-success',
		progress: 'progress-success',
	},
	warning: {
		button: 'btn-warning',
		badge: 'badge-warning',
		checkbox: 'checkbox-warning',
		radio: 'radio-warning',
		toggle: 'toggle-warning',
		progress: 'progress-warning',
	},
	error: {
		button: 'btn-error',
		badge: 'badge-error',
		checkbox: 'checkbox-error',
		radio: 'radio-error',
		toggle: 'toggle-error',
		progress: 'progress-error',
	},
};

export type ConsoleThemeComponentPreviewProps = ComponentPropsWithRef<'div'> & {
	theme: ConsoleThemeOption;
	size?: ConsoleThemePreviewSize;
	tone?: ConsoleThemePreviewTone;
	density?: ConsoleDisplayDensity;
	radius?: ConsoleDisplayRadius;
	onSizeChange?: (size: ConsoleThemePreviewSize) => void;
	onToneChange?: (tone: ConsoleThemePreviewTone) => void;
};

export function ConsoleThemeComponentPreview({
	theme,
	size = 'sm',
	tone = 'primary',
	density = 'comfortable',
	radius = 'soft',
	onSizeChange,
	onToneChange,
	className,
	style,
	...props
}: ConsoleThemeComponentPreviewProps) {
	const sizeId = useId();
	const toneId = useId();
	const radioName = useId();
	const sizeClass = previewSizeClass[size];
	const toneClass = previewToneClass[tone];
	const compact = density === 'compact';

	return (
		<div
			data-slot='console-theme-component-preview'
			data-theme={theme.value}
			data-density={density}
			data-radius={radius}
			className={cn(
				'border-base-300 bg-base-100 text-base-content min-w-0 overflow-hidden rounded-md border shadow-sm',
				className,
			)}
			style={getConsoleThemePreviewStyle(radius, style)}
			{...props}
		>
			<header className='border-base-300 bg-base-200/55 flex flex-wrap items-end gap-2 border-b p-3'>
				<div className='min-w-0 flex-1'>
					<div className='truncate text-xs font-semibold'>{theme.label}</div>
					<div className='text-base-content/65 truncate text-[11px]'>{theme.value}</div>
				</div>
				<label className='grid gap-1 text-[11px]' htmlFor={sizeId}>
					<span className='text-base-content/65'>尺寸</span>
					<select
						id={sizeId}
						className='select select-xs w-20'
						value={size}
						onChange={(event) => onSizeChange?.(event.target.value as ConsoleThemePreviewSize)}
					>
						{sizeOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label className='grid gap-1 text-[11px]' htmlFor={toneId}>
					<span className='text-base-content/65'>语义色</span>
					<select
						id={toneId}
						className='select select-xs w-28'
						value={tone}
						onChange={(event) => onToneChange?.(event.target.value as ConsoleThemePreviewTone)}
					>
						{toneOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
			</header>

			<div inert aria-hidden='true' className={cn('grid', compact ? 'gap-3 p-3' : 'gap-4 p-4')}>
				<section aria-label='主题色板'>
					<div className='grid grid-cols-4 gap-1.5'>
						{[
							['Primary', 'bg-primary text-primary-content'],
							['Secondary', 'bg-secondary text-secondary-content'],
							['Accent', 'bg-accent text-accent-content'],
							['Neutral', 'bg-neutral text-neutral-content'],
							['Info', 'bg-info text-info-content'],
							['Success', 'bg-success text-success-content'],
							['Warning', 'bg-warning text-warning-content'],
							['Error', 'bg-error text-error-content'],
						].map(([label, colorClass]) => (
							<div
								key={label}
								className={cn('grid min-h-12 place-items-center rounded-sm p-1 text-center text-[11px]', colorClass)}
							>
								{label}
							</div>
						))}
					</div>
				</section>

				<section aria-label='按钮与徽标' className='flex flex-wrap items-center gap-2'>
					<button type='button' className={cn('btn', sizeClass.button, toneClass.button)}>
						操作
					</button>
					<button type='button' className={cn('btn btn-outline', sizeClass.button, toneClass.button)}>
						次要
					</button>
					<button type='button' className={cn('btn btn-ghost', sizeClass.button)}>
						幽灵
					</button>
					<button type='button' className={cn('btn', sizeClass.button)} disabled>
						禁用
					</button>
					<span className={cn('badge', sizeClass.badge, toneClass.badge)}>状态</span>
					<span className={cn('badge badge-outline', sizeClass.badge, toneClass.badge)}>Outline</span>
				</section>

				<section aria-label='表单控件' className='grid gap-3 sm:grid-cols-2'>
					<input
						aria-label='组件预览输入框'
						className={cn('input w-full', sizeClass.input)}
						placeholder='输入内容'
						readOnly
					/>
					<div className='flex flex-wrap items-center gap-4'>
						<label className='flex items-center gap-2 text-xs'>
							<input
								type='checkbox'
								className={cn('checkbox', sizeClass.checkbox, toneClass.checkbox)}
								defaultChecked
							/>
							复选
						</label>
						<label className='flex items-center gap-2 text-xs'>
							<input
								type='radio'
								name={radioName}
								className={cn('radio', sizeClass.radio, toneClass.radio)}
								defaultChecked
							/>
							单选
						</label>
						<label className='flex items-center gap-2 text-xs'>
							<input type='checkbox' className={cn('toggle', sizeClass.toggle, toneClass.toggle)} defaultChecked />
							开关
						</label>
					</div>
				</section>

				<section aria-label='导航与进度' className='grid gap-3'>
					<div className='tabs tabs-border' aria-label='导航样例'>
						<span className='tab tab-active text-xs'>概览</span>
						<span className='tab text-xs'>事件</span>
						<span className='tab text-xs'>审计</span>
					</div>
					<progress className={cn('progress w-full', toneClass.progress)} value='68' max='100' />
				</section>

				<section aria-label='消息状态' className='grid gap-2'>
					<div className='border-info/35 bg-info/5 flex items-start gap-2 rounded-sm border p-2 text-xs'>
						<Info className='text-info mt-0.5 size-3.5 shrink-0' />
						<span>同步正在进行</span>
					</div>
					<div className='border-success/35 bg-success/5 flex items-start gap-2 rounded-sm border p-2 text-xs'>
						<CheckCircle2 className='text-success mt-0.5 size-3.5 shrink-0' />
						<span>配置已生效</span>
					</div>
					<div className='border-warning/40 bg-warning/5 flex items-start gap-2 rounded-sm border p-2 text-xs'>
						<AlertTriangle className='text-warning mt-0.5 size-3.5 shrink-0' />
						<span>存在待处理项</span>
					</div>
				</section>
			</div>
		</div>
	);
}
