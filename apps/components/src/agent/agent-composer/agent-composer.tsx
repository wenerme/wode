'use client';

import { FilePlus2, ImagePlus, Music2, Send, Square } from 'lucide-react';
import type { ChangeEvent, ClipboardEvent, CompositionEvent, DragEvent, FormEvent, KeyboardEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { AgentComposerAttachment } from './agent-composer-attachment';
import {
	resolveAgentComposerLimits,
	validateAgentComposerControlledFiles,
	validateAgentComposerFiles,
} from './agent-composer-files';
import type { AgentComposerError, AgentComposerProps } from './agent-composer-types';
import { resolveAgentComposerMessages } from './agent-composer-types';

export function AgentComposer({
	accept,
	className,
	disabled = false,
	error,
	files,
	leading,
	maxFileSize,
	maxFiles,
	maxTotalSize,
	messages,
	microphone,
	model,
	onDragEnter,
	onDragLeave,
	onDragOver,
	onDrop,
	onError,
	onFilesChange,
	onStop,
	onSubmit,
	onValueChange,
	settings,
	status = 'ready',
	textareaProps,
	trailing,
	value,
	...props
}: AgentComposerProps) {
	const copy = resolveAgentComposerMessages(messages);
	const limits = useMemo(
		() => resolveAgentComposerLimits({ maxFileSize, maxFiles, maxTotalSize }),
		[maxFileSize, maxFiles, maxTotalSize],
	);
	const controlledValidation = useMemo(
		() => validateAgentComposerControlledFiles(files, limits, copy),
		[copy, files, limits],
	);
	const validFiles = controlledValidation.accepted;
	const controlledError = controlledValidation.errors.at(-1);
	const [validationError, setValidationError] = useState<AgentComposerError>();
	const [dragActive, setDragActive] = useState(false);
	const composing = useRef(false);
	const imageInput = useRef<HTMLInputElement>(null);
	const audioInput = useRef<HTMLInputElement>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const busy = status === 'submitting' || status === 'streaming';
	const canSend = !disabled && !busy && (value.trim().length > 0 || validFiles.length > 0);
	const fileEntries = withFileOccurrenceKeys(validFiles);

	function addFiles(incoming: Iterable<File>) {
		if (disabled || busy) return;
		const result = validateAgentComposerFiles(validFiles, incoming, limits, copy);
		for (const issue of result.errors) onError?.(issue);
		setValidationError(result.errors.at(-1));
		if (result.accepted.length > 0) onFilesChange([...files, ...result.accepted]);
	}

	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		if (event.currentTarget.files) addFiles(event.currentTarget.files);
		event.currentTarget.value = '';
	}

	function removeFile(file: File) {
		setValidationError(undefined);
		const sourceIndex = files.indexOf(file);
		if (sourceIndex >= 0) onFilesChange(files.filter((_file, current) => current !== sourceIndex));
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSend) return;
		setValidationError(undefined);
		onSubmit({ text: value, files: [...validFiles] });
	}

	const {
		className: textareaClassName,
		onChange: onTextareaChange,
		onCompositionEnd,
		onCompositionStart,
		onKeyDown,
		onPaste,
		...textareaRest
	} = textareaProps ?? {};

	function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		onKeyDown?.(event);
		if (
			event.defaultPrevented ||
			event.key !== 'Enter' ||
			event.shiftKey ||
			composing.current ||
			event.nativeEvent.isComposing
		) {
			return;
		}
		event.preventDefault();
		if (canSend) event.currentTarget.form?.requestSubmit();
	}

	function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
		onPaste?.(event);
		if (event.defaultPrevented) return;
		const pasted: File[] = [];
		for (const item of event.clipboardData.items) {
			if (item.kind !== 'file') continue;
			const file = item.getAsFile();
			if (file) pasted.push(file);
		}
		if (pasted.length > 0) addFiles(pasted);
	}

	function handleCompositionStart(event: CompositionEvent<HTMLTextAreaElement>) {
		composing.current = true;
		onCompositionStart?.(event);
	}

	function handleCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
		composing.current = false;
		onCompositionEnd?.(event);
	}

	function handleDrop(event: DragEvent<HTMLFormElement>) {
		onDrop?.(event);
		setDragActive(false);
		if (event.defaultPrevented || !event.dataTransfer.types.includes('Files')) return;
		event.preventDefault();
		addFiles(event.dataTransfer.files);
	}

	return (
		<form
			data-slot='agent-composer'
			data-status={status}
			data-drop-active={dragActive ? 'true' : 'false'}
			data-invalid-attachments={controlledError ? 'true' : 'false'}
			aria-busy={busy || undefined}
			aria-label={copy.composerLabel}
			className={cn(
				'border-border bg-background relative flex w-full min-w-0 flex-col rounded-md border shadow-sm',
				disabled && 'opacity-60',
				status === 'error' && 'border-error',
				className,
			)}
			onDragEnter={(event) => {
				onDragEnter?.(event);
				if (!event.defaultPrevented && event.dataTransfer.types.includes('Files')) setDragActive(true);
			}}
			onDragLeave={(event) => {
				onDragLeave?.(event);
				const nextTarget = event.relatedTarget;
				if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setDragActive(false);
			}}
			onDragOver={(event) => {
				onDragOver?.(event);
				if (!event.defaultPrevented && event.dataTransfer.types.includes('Files')) event.preventDefault();
			}}
			onDrop={handleDrop}
			onSubmit={handleSubmit}
			{...props}
		>
			<input
				ref={imageInput}
				type='file'
				accept='image/*'
				aria-label={copy.selectImage}
				className='sr-only'
				disabled={disabled || busy}
				multiple
				onChange={handleFileChange}
			/>
			<input
				ref={audioInput}
				type='file'
				accept='audio/*'
				aria-label={copy.selectAudio}
				className='sr-only'
				disabled={disabled || busy}
				multiple
				onChange={handleFileChange}
			/>
			<input
				ref={fileInput}
				type='file'
				accept={accept}
				aria-label={copy.selectFile}
				className='sr-only'
				disabled={disabled || busy}
				multiple
				onChange={handleFileChange}
			/>
			{validFiles.length > 0 ? (
				<ul aria-label={copy.attachmentsLabel} className='flex max-h-36 flex-wrap gap-2 overflow-y-auto px-3 pt-3'>
					{fileEntries.map(({ file, key }) => (
						<AgentComposerAttachment key={key} file={file} messages={copy} onRemove={() => removeFile(file)} />
					))}
				</ul>
			) : null}
			<textarea
				aria-label={textareaRest['aria-label'] ?? copy.placeholder}
				className={cn(
					'placeholder:text-muted-foreground field-sizing-content max-h-48 min-h-[4.5rem] w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none',
					textareaClassName,
				)}
				disabled={disabled}
				placeholder={textareaRest.placeholder ?? copy.placeholder}
				value={value}
				onChange={(event) => {
					onValueChange(event.currentTarget.value);
					onTextareaChange?.(event);
				}}
				onCompositionEnd={handleCompositionEnd}
				onCompositionStart={handleCompositionStart}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				{...textareaRest}
			/>
			{error !== undefined || validationError || controlledError ? (
				<div role='alert' className='text-error px-3 pb-2 text-xs'>
					{error ?? (
						<ul className='space-y-0.5'>
							{validationError ? <li>{validationError.message}</li> : null}
							{controlledValidation.errors.map((issue) => (
								<li key={`${issue.code}:${issue.message}:${issue.files.map(fileIdentity).join('|')}`}>
									{issue.message}
								</li>
							))}
						</ul>
					)}
				</div>
			) : null}
			<div
				data-slot='agent-composer-toolbar'
				className='border-border flex min-h-11 min-w-0 flex-wrap items-center gap-1 border-t px-2 py-1.5'
			>
				{leading}
				<ComposerIconButton
					label={copy.attachImage}
					disabled={disabled || busy}
					onClick={() => imageInput.current?.click()}
				>
					<ImagePlus aria-hidden='true' className='size-4' />
				</ComposerIconButton>
				<ComposerIconButton
					label={copy.attachAudio}
					disabled={disabled || busy}
					onClick={() => audioInput.current?.click()}
				>
					<Music2 aria-hidden='true' className='size-4' />
				</ComposerIconButton>
				<ComposerIconButton
					label={copy.attachFile}
					disabled={disabled || busy}
					onClick={() => fileInput.current?.click()}
				>
					<FilePlus2 aria-hidden='true' className='size-4' />
				</ComposerIconButton>
				{microphone}
				{model}
				{settings}
				<span className='min-w-2 flex-1' />
				{trailing}
				{busy ? (
					<ComposerIconButton label={copy.stop} disabled={disabled || !onStop} className='btn-error' onClick={onStop}>
						<Square aria-hidden='true' className='size-3.5 fill-current' />
					</ComposerIconButton>
				) : (
					<ComposerIconButton label={copy.send} disabled={!canSend} className='btn-primary' submit>
						<Send aria-hidden='true' className='size-4' />
					</ComposerIconButton>
				)}
			</div>
			{dragActive ? (
				<div className='border-primary bg-primary/10 pointer-events-none absolute inset-1 z-10 flex items-center justify-center rounded-md border border-dashed text-sm font-medium'>
					{copy.dropFiles}
				</div>
			) : null}
		</form>
	);
}

function withFileOccurrenceKeys(files: readonly File[]) {
	const occurrences = new Map<string, number>();
	return files.map((file) => {
		const identity = fileIdentity(file);
		const occurrence = occurrences.get(identity) ?? 0;
		occurrences.set(identity, occurrence + 1);
		return { file, key: `${identity}:${occurrence}` };
	});
}

function fileIdentity(file: File) {
	return `${file.webkitRelativePath}:${file.name}:${file.type}:${file.size}:${file.lastModified}`;
}

function ComposerIconButton({
	children,
	className,
	disabled,
	label,
	onClick,
	submit = false,
}: {
	children: import('react').ReactNode;
	className?: string;
	disabled?: boolean;
	label: string;
	onClick?: () => void;
	submit?: boolean;
}) {
	return (
		<button
			type={submit ? 'submit' : 'button'}
			aria-label={label}
			title={label}
			className={cn('btn btn-ghost btn-circle btn-sm size-8 min-h-8 min-w-8 p-0', className)}
			disabled={disabled}
			onClick={onClick}
		>
			{children}
		</button>
	);
}
