'use client';

import { Braces, FilePenLine, RotateCcw, Save } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useId, useState } from 'react';
import { mergeAiConfigEditorMessages } from './ai-config-messages';
import type {
	AiConfigDraftController,
	AiConfigEditorMessageOverrides,
	AiConfigEditorMode,
	AiConfigEditorSlots,
	AiConfigFieldSlotProps,
} from './ai-config-types';

export type AiConfigEditorProps<T> = Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> & {
	title: ReactNode;
	description?: ReactNode;
	controller: AiConfigDraftController<T>;
	children: ReactNode;
	messages?: AiConfigEditorMessageOverrides;
	slots?: AiConfigEditorSlots<T>;
	disabled?: boolean;
	readOnly?: boolean;
	showSubmit?: boolean;
	initialMode?: AiConfigEditorMode;
};

export function AiConfigEditor<T>({
	title,
	description,
	controller,
	children,
	messages: messageOverrides,
	slots,
	disabled = false,
	readOnly = false,
	showSubmit = false,
	initialMode = 'form',
	className,
	...props
}: AiConfigEditorProps<T>) {
	const messages = mergeAiConfigEditorMessages(messageOverrides);
	const jsonId = useId();
	const [mode, setMode] = useState<AiConfigEditorMode>(initialMode);
	const issues = controller.visibleIssues;
	const Summary = slots?.summary;
	const defaultSummary = issues.length ? (
		<div className='border-warning/50 bg-warning/10 rounded-sm border px-3 py-2' role='alert'>
			<div className='flex flex-wrap items-center justify-between gap-2 text-sm font-medium'>
				<span>{messages.validationTitle}</span>
				<span className='badge badge-warning badge-sm'>{messages.validationCount(issues.length)}</span>
			</div>
			<ul className='mt-1 list-inside list-disc text-xs'>
				{issues.slice(0, 8).map((issue) => (
					<li key={`${issue.path}:${issue.message}`}>
						{issue.path ? `${issue.path}: ` : ''}
						{issue.message}
					</li>
				))}
			</ul>
		</div>
	) : null;
	return (
		<div
			data-slot='ai-config-editor'
			data-mode={mode}
			data-invalid={controller.externalInvalid || issues.length ? 'true' : 'false'}
			data-readonly={readOnly || undefined}
			className={`border-base-300 bg-base-100 min-w-0 overflow-hidden rounded-md border ${className ?? ''}`}
			{...props}
		>
			<header className='border-base-300 bg-base-200/35 flex min-h-16 flex-wrap items-start gap-3 border-b px-3 py-3 md:px-4'>
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap items-center gap-2'>
						<h2 className='text-sm font-semibold'>{title}</h2>
						{readOnly ? <span className='badge badge-outline badge-sm'>{messages.readOnly}</span> : null}
					</div>
					{description ? <div className='text-base-content/60 mt-0.5 text-xs'>{description}</div> : null}
				</div>
				<div className='flex w-full min-w-0 flex-wrap items-center justify-end gap-1 sm:w-auto'>
					<div className='join' role='group' aria-label='编辑模式'>
						<ModeButton active={mode === 'form'} label={messages.formMode} onClick={() => setMode('form')}>
							<FilePenLine aria-hidden='true' className='size-3.5' />
						</ModeButton>
						<ModeButton active={mode === 'json'} label={messages.jsonMode} onClick={() => setMode('json')}>
							<Braces aria-hidden='true' className='size-3.5' />
						</ModeButton>
					</div>
					{slots?.headerActions}
					{!readOnly ? (
						<button
							type='button'
							className='btn btn-ghost btn-sm btn-square'
							title={messages.reset}
							aria-label={messages.reset}
							disabled={disabled || !controller.dirty}
							onClick={controller.reset}
						>
							<RotateCcw aria-hidden='true' className='size-4' />
						</button>
					) : null}
					{showSubmit && !readOnly ? (
						<button type='button' className='btn btn-primary btn-sm' disabled={disabled} onClick={controller.submit}>
							<Save aria-hidden='true' className='size-4' />
							{messages.submit}
						</button>
					) : null}
				</div>
			</header>
			<div className='space-y-4 p-3 md:p-4'>
				{controller.externalInvalid ? (
					<div className='alert alert-error items-start text-sm' role='alert'>
						<div>
							<div className='font-semibold'>{messages.invalidExternalTitle}</div>
							<div className='mt-0.5 text-xs'>{messages.invalidExternalDescription}</div>
							{controller.externalError ? <code className='mt-1 block text-xs'>{controller.externalError}</code> : null}
						</div>
					</div>
				) : null}
				{Summary ? <Summary issues={issues} defaultSummary={defaultSummary} /> : defaultSummary}
				{mode === 'form' ? (
					<>
						{slots?.beforeForm}
						<div className='space-y-6'>{children}</div>
						{slots?.afterForm}
					</>
				) : (
					<div>
						<label className='mb-1 block text-sm font-medium' htmlFor={jsonId}>
							{messages.jsonLabel}
						</label>
						<textarea
							id={jsonId}
							className='textarea textarea-bordered min-h-96 w-full font-mono text-xs leading-5'
							aria-invalid={Boolean(controller.jsonError) || undefined}
							readOnly={readOnly}
							disabled={disabled}
							value={controller.jsonText}
							onChange={(event) => controller.setJsonText(event.target.value)}
						/>
						{controller.jsonError ? (
							<p className='text-error mt-1 text-xs' role='alert'>
								{messages.invalidJson}: {controller.jsonError}
							</p>
						) : null}
						{!readOnly ? (
							<div className='mt-2 flex justify-end'>
								<button
									type='button'
									className='btn btn-outline btn-sm'
									disabled={disabled}
									onClick={controller.applyJson}
								>
									<Braces aria-hidden='true' className='size-4' />
									{messages.applyJson}
								</button>
							</div>
						) : null}
					</div>
				)}
			</div>
		</div>
	);
}

export type AiConfigFieldSlotPropsWithSlots<T> = AiConfigFieldSlotProps<T> & {
	slots?: AiConfigEditorSlots<T>;
};

export function AiConfigFieldSlot<T>({ slots, ...props }: AiConfigFieldSlotPropsWithSlots<T>) {
	const Slot =
		slots?.fieldSlots && Object.hasOwn(slots.fieldSlots, props.name) ? slots.fieldSlots[props.name] : undefined;
	return Slot ? <Slot {...props} /> : props.defaultField;
}

function ModeButton({
	active,
	label,
	onClick,
	children,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type='button'
			className={`btn btn-sm join-item ${active ? 'btn-active' : 'btn-ghost'}`}
			aria-pressed={active}
			onClick={onClick}
		>
			{children}
			<span>{label}</span>
		</button>
	);
}
