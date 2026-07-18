'use client';

import { AlertCircle, LoaderCircle, Pencil, Save, X } from 'lucide-react';
import type { ComponentPropsWithRef, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { FileViewerFileDescriptor, FileViewerMessages } from './file-viewer-types';
import { mergeFileViewerMessages } from './file-viewer-types';

export type TextFileViewerProps = Omit<ComponentPropsWithRef<'section'>, 'children' | 'onChange'> & {
	file: FileViewerFileDescriptor;
	text: string;
	draft?: string;
	editing?: boolean;
	defaultEditing?: boolean;
	error?: ReactNode;
	messages?: Partial<FileViewerMessages>;
	onDraftChange?: (draft: string) => void;
	onEditingChange?: (editing: boolean) => void;
	onSave?: (draft: string) => Promise<void> | void;
	pending?: boolean;
	readOnly?: boolean;
	showHeader?: boolean;
	textareaProps?: Omit<ComponentPropsWithRef<'textarea'>, 'children' | 'defaultValue' | 'onChange' | 'value'>;
};

export function TextFileViewer({
	className,
	defaultEditing = false,
	draft: controlledDraft,
	editing: controlledEditing,
	error,
	file,
	messages: messageOverrides,
	onDraftChange,
	onEditingChange,
	onSave,
	pending = false,
	readOnly = false,
	showHeader = true,
	text,
	textareaProps,
	...props
}: TextFileViewerProps) {
	const messages = mergeFileViewerMessages(messageOverrides);
	const [internalDraft, setInternalDraft] = useState(text);
	const [internalEditing, setInternalEditing] = useState(defaultEditing);
	const [internalPending, setInternalPending] = useState(false);
	const [internalError, setInternalError] = useState<ReactNode>();
	const previousText = useRef(text);
	const draft = controlledDraft ?? internalDraft;
	const editing = !readOnly && (controlledEditing ?? internalEditing);
	const saving = pending || internalPending;
	const dirty = isTextFileViewerDirty(text, draft);
	const canEdit = !readOnly && Boolean(onSave || onDraftChange || controlledDraft !== undefined);

	const changeDraft = (nextDraft: string) => {
		if (controlledDraft === undefined) setInternalDraft(nextDraft);
		onDraftChange?.(nextDraft);
		setInternalError(undefined);
	};
	const changeEditing = (nextEditing: boolean) => {
		if (controlledEditing === undefined) setInternalEditing(nextEditing);
		onEditingChange?.(nextEditing);
	};

	useEffect(() => {
		if (previousText.current === text) return;
		const wasDirty = draft !== previousText.current;
		previousText.current = text;
		if (!editing || !wasDirty) changeDraft(text);
	}, [draft, editing, text]);

	const cancel = () => {
		if (saving) return;
		changeDraft(text);
		changeEditing(false);
	};
	const save = async () => {
		if (!onSave || !dirty || saving) return;
		setInternalPending(true);
		setInternalError(undefined);
		try {
			await onSave(draft);
			changeEditing(false);
		} catch (saveError) {
			setInternalError(messages.saveFailed(saveError));
		} finally {
			setInternalPending(false);
		}
	};
	const handleSaveShortcut = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		textareaProps?.onKeyDown?.(event);
		if (event.defaultPrevented || !onSave || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's')
			return;
		event.preventDefault();
		void save();
	};
	const effectiveError = internalError ?? error;

	return (
		<section
			data-slot='text-file-viewer'
			data-dirty={dirty || undefined}
			data-editing={editing || undefined}
			className={cn('bg-base-100 flex min-h-64 min-w-0 flex-col', !showHeader && 'relative', className)}
			{...props}
		>
			{showHeader ? (
				<div className='border-base-300 flex min-h-10 shrink-0 items-center gap-2 border-b px-2 py-1.5'>
					<div className='min-w-0 flex-1 truncate text-xs font-medium'>{file.name}</div>
					{readOnly ? <span className='badge badge-ghost badge-sm'>{messages.readOnly}</span> : null}
					{editing ? (
						<div
							role='toolbar'
							aria-label={messages.editingActionsLabel(file)}
							className='flex shrink-0 items-center gap-1'
						>
							<button type='button' className='btn btn-ghost btn-sm' disabled={saving} onClick={cancel}>
								<X aria-hidden='true' className='size-4' />
								{messages.cancel}
							</button>
							{onSave ? (
								<button
									type='button'
									className='btn btn-primary btn-sm'
									disabled={!dirty || saving}
									aria-busy={saving || undefined}
									onClick={() => void save()}
								>
									{saving ? (
										<LoaderCircle aria-hidden='true' className='size-4 animate-spin' />
									) : (
										<Save aria-hidden='true' className='size-4' />
									)}
									{saving ? messages.saving : messages.save}
								</button>
							) : null}
						</div>
					) : canEdit ? (
						<button
							type='button'
							aria-label={messages.editFileLabel(file)}
							title={messages.editFileLabel(file)}
							className='btn btn-ghost btn-sm'
							disabled={saving}
							onClick={() => changeEditing(true)}
						>
							<Pencil aria-hidden='true' className='size-4' />
							{messages.edit}
						</button>
					) : null}
				</div>
			) : editing ? (
				<div
					role='toolbar'
					aria-label={messages.editingActionsLabel(file)}
					className='border-base-300 flex min-h-10 shrink-0 items-center justify-end gap-1 border-b px-2 py-1.5'
				>
					<button type='button' className='btn btn-ghost btn-sm' disabled={saving} onClick={cancel}>
						<X aria-hidden='true' className='size-4' />
						{messages.cancel}
					</button>
					{onSave ? (
						<button
							type='button'
							className='btn btn-primary btn-sm'
							disabled={!dirty || saving}
							aria-busy={saving || undefined}
							onClick={() => void save()}
						>
							{saving ? (
								<LoaderCircle aria-hidden='true' className='size-4 animate-spin' />
							) : (
								<Save aria-hidden='true' className='size-4' />
							)}
							{saving ? messages.saving : messages.save}
						</button>
					) : null}
				</div>
			) : canEdit ? (
				<button
					type='button'
					aria-label={messages.editFileLabel(file)}
					title={messages.editFileLabel(file)}
					className='btn btn-ghost btn-sm bg-base-100/90 absolute top-2 right-2 z-10'
					disabled={saving}
					onClick={() => changeEditing(true)}
				>
					<Pencil aria-hidden='true' className='size-4' />
					{messages.edit}
				</button>
			) : null}
			{effectiveError ? (
				<div
					role='alert'
					className='border-error/30 bg-error/10 text-error flex items-start gap-2 border-b px-3 py-2 text-xs'
				>
					<AlertCircle aria-hidden='true' className='mt-0.5 size-4 shrink-0' />
					<div className='min-w-0 break-words'>{effectiveError}</div>
				</div>
			) : null}
			{editing ? (
				<textarea
					aria-label={textareaProps?.['aria-label'] ?? messages.editorLabel(file)}
					aria-keyshortcuts={onSave ? 'Control+S Meta+S' : undefined}
					spellCheck={textareaProps?.spellCheck ?? false}
					{...textareaProps}
					className={cn(
						'bg-base-200 min-h-60 min-w-0 flex-1 resize-none p-3 font-mono text-xs leading-5 outline-none',
						'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-inset',
						textareaProps?.className,
					)}
					disabled={saving || textareaProps?.disabled}
					value={draft}
					onChange={(event) => changeDraft(event.target.value)}
					onKeyDown={handleSaveShortcut}
				/>
			) : (
				<pre className='min-h-60 min-w-0 flex-1 overflow-auto p-3 font-mono text-xs leading-5 break-words whitespace-pre-wrap'>
					{text}
				</pre>
			)}
		</section>
	);
}

export function isTextFileViewerDirty(text: string, draft: string): boolean {
	return text !== draft;
}
