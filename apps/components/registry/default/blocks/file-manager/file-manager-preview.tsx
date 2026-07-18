'use client';

import { Check, Clipboard, File, FileArchive, FileAudio, FileImage, FileVideo, Folder } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { readFileViewerBytes } from '@/components/file-viewer/file-system-file-viewer';
import { FileViewer } from '@/components/file-viewer/file-viewer';
import { resolveFileSystemViewerKind } from '@/components/file-viewer/file-viewer-kind';
import type { FileViewerFileDescriptor, FileViewerKind } from '@/components/file-viewer/file-viewer-types';
import { HeaderContentFooterLayout } from '@/components/ui/header-content-footer-layout';
import { cn } from '@/lib/utils';
import { useFileManagerActions, useFileManagerStore, useFileManagerStoreContext } from './file-manager-context';
import type { FileManagerFileStat, FileManagerFileSystem } from './file-manager-types';
import { formatFileManagerBytes, getFileManagerExtension, sanitizeFileManagerStat } from './file-manager-utils';

export type FileManagerPreviewProps = ComponentPropsWithRef<'div'> & {
	entry?: FileManagerFileStat;
	maxPreviewBytes?: number;
};

export function FileManagerPreview({
	className,
	entry,
	maxPreviewBytes = 512 * 1024,
	...props
}: FileManagerPreviewProps) {
	const fileSystem = useFileManagerStore((state) => state.fileSystem);
	const canEdit = useFileManagerStore((state) => state.capabilities.edit);
	const canDownload = useFileManagerStore((state) => state.capabilities.download);
	const operationRunning = useFileManagerStore((state) => state.operation.status === 'running');
	const editor = useFileManagerStore(
		useShallow((state) => ({
			draft: state.preview.draft,
			pendingSavePath: state.preview.pendingSavePath,
			saveError: state.preview.saveError,
		})),
	);
	const actions = useFileManagerActions();
	const store = useFileManagerStoreContext();
	const [state, setState] = useState<{
		data?: Uint8Array;
		content?: string;
		entry?: FileManagerFileStat;
		error?: string;
		kind?: FileViewerKind;
		loading: boolean;
		path?: string;
	}>({ loading: false });
	const [copied, setCopied] = useState(false);
	const [copyError, setCopyError] = useState<string>();
	const copyGeneration = useRef(0);
	const copyResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const viewState: typeof state =
		state.path === entry?.path ? state : { loading: Boolean(entry?.kind === 'file'), path: entry?.path };
	const mediaKind =
		viewState.kind ??
		(entry?.kind === 'file'
			? resolveFileSystemViewerKind({
					name: entry.name,
					path: entry.path,
					mimeType: getFileManagerViewerMimeType(entry),
				})
			: 'unsupported');
	const editorDraft = editor.draft;
	const editorSaveError = editor.saveError;
	const draftContent = editorDraft && editorDraft.path === entry?.path ? editorDraft.content : undefined;
	const saving = editor.pendingSavePath === entry?.path && operationRunning;
	const saveError = editorSaveError && editorSaveError.path === entry?.path ? editorSaveError.message : undefined;

	useEffect(() => {
		let active = true;
		const controller = new AbortController();
		setState({ loading: Boolean(entry?.kind === 'file'), path: entry?.path });
		if (!entry || entry.kind === 'directory') return () => undefined;
		void (async () => {
			try {
				const currentEntry = sanitizeFileManagerStat(
					await fileSystem.stat(entry.path, { signal: controller.signal }),
					entry.path,
				);
				if (currentEntry.kind !== 'file') throw new Error('预览目标已不再是文件');
				const kind = resolveFileSystemViewerKind({
					name: currentEntry.name,
					path: currentEntry.path,
					mimeType: getFileManagerViewerMimeType(currentEntry),
				});
				if (kind === 'unsupported') {
					if (active) setState({ entry: currentEntry, kind, loading: false, path: entry.path });
					return;
				}
				if (currentEntry.size > maxPreviewBytes) {
					throw new Error(`文件超过预览上限 ${formatFileManagerBytes(maxPreviewBytes)}`);
				}
				const data = await readFileManagerPreviewData(
					fileSystem,
					currentEntry.path,
					maxPreviewBytes,
					controller.signal,
				);
				if (kind === 'text') {
					const content = new TextDecoder().decode(data);
					if (active) setState({ content, entry: currentEntry, kind, loading: false, path: entry.path });
					return;
				}
				if (active) setState({ data, entry: currentEntry, kind, loading: false, path: entry.path });
			} catch (error) {
				if (active)
					setState({ error: error instanceof Error ? error.message : String(error), loading: false, path: entry.path });
			}
		})();

		return () => {
			active = false;
			controller.abort();
		};
	}, [entry, fileSystem, maxPreviewBytes]);

	useEffect(() => {
		copyGeneration.current += 1;
		if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
		setCopied(false);
		setCopyError(undefined);
	}, [entry?.path]);

	useEffect(() => {
		return () => {
			copyGeneration.current += 1;
			if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
		};
	}, []);

	const requestSave = (nextDraft = draftContent) => {
		if (!entry || nextDraft === undefined || saving) return;
		if (operationRunning) {
			actions.setPreviewSaveError(entry.path, '另一个文件操作正在执行');
			return;
		}
		actions.setPreviewSaveError(entry.path, undefined);
		actions.requestOperation({ type: 'save-text', path: entry.path, content: nextDraft });
	};

	const metadata = useMemo(
		() =>
			entry
				? [
						['类型', entry.kind === 'directory' ? '目录' : getFileManagerExtension(entry.name).toUpperCase() || '文件'],
						['大小', entry.kind === 'directory' ? '—' : formatFileManagerBytes(entry.size)],
						['修改时间', entry.mtime ? new Date(entry.mtime).toLocaleString() : '—'],
					]
				: [],
		[entry],
	);

	if (!entry) {
		return (
			<HeaderContentFooterLayout
				className={cn('h-full', className)}
				contentClassName='text-base-content/55 grid place-items-center p-6 text-center text-xs'
				data-file-manager-preview=''
				{...props}
			>
				选择文件查看预览
			</HeaderContentFooterLayout>
		);
	}

	return (
		<HeaderContentFooterLayout
			className={cn('h-full', className)}
			data-file-manager-preview=''
			header={
				<div className='border-base-300 flex min-h-11 items-center gap-2 border-b px-3 py-2'>
					<div className='bg-base-200 grid size-7 shrink-0 place-items-center rounded-md'>
						{entry.kind === 'directory' ? (
							<Folder className='text-warning size-4' />
						) : mediaKind === 'unsupported' ? (
							<FileArchive className='size-4' />
						) : mediaKind === 'image' ? (
							<FileImage className='text-info size-4' />
						) : mediaKind === 'audio' ? (
							<FileAudio className='text-secondary size-4' />
						) : mediaKind === 'video' ? (
							<FileVideo className='text-accent size-4' />
						) : (
							<File className='size-4' />
						)}
					</div>
					<div className='min-w-0 flex-1'>
						<div className='truncate text-xs font-medium'>{entry.name || '/'}</div>
						<div className='text-base-content/50 truncate font-mono text-[10px]'>{entry.path}</div>
					</div>
					<button
						type='button'
						aria-label='复制路径'
						title='复制路径'
						className='hover:bg-base-200 grid size-7 place-items-center rounded-md'
						onClick={() => {
							void (async () => {
								const generation = copyGeneration.current + 1;
								copyGeneration.current = generation;
								try {
									if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
									await navigator.clipboard.writeText(entry.path);
									if (copyGeneration.current !== generation) return;
									setCopyError(undefined);
									setCopied(true);
									if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
									copyResetTimer.current = setTimeout(() => {
										if (copyGeneration.current === generation) setCopied(false);
									}, 1200);
								} catch {
									if (copyGeneration.current !== generation) return;
									setCopied(false);
									setCopyError('复制路径失败');
								}
							})();
						}}
					>
						{copied ? <Check className='text-success size-3.5' /> : <Clipboard className='size-3.5' />}
					</button>
					{copyError ? (
						<span role='alert' className='sr-only'>
							{copyError}
						</span>
					) : null}
				</div>
			}
			footer={
				<dl className='divide-base-300 border-base-300 shrink-0 divide-y border-t text-xs'>
					{metadata.map(([label, value]) => (
						<div key={label} className='grid grid-cols-[5rem_minmax(0,1fr)] gap-2 px-3 py-2'>
							<dt className='text-base-content/55'>{label}</dt>
							<dd className='min-w-0 truncate text-right'>{value}</dd>
						</div>
					))}
				</dl>
			}
			{...props}
		>
			{viewState.loading ? (
				<div role='status' className='text-base-content/55 grid min-h-48 place-items-center text-xs'>
					正在读取预览…
				</div>
			) : viewState.error ? (
				<div role='alert' className='text-error p-3 text-xs leading-5'>
					{viewState.error}
				</div>
			) : entry.kind === 'file' ? (
				<FileViewer
					key={entry.path}
					bytes={viewState.data}
					className='min-h-48'
					draft={draftContent}
					editing={draftContent !== undefined}
					file={toFileViewerDescriptor(viewState.entry ?? entry)}
					kind={mediaKind}
					onDownload={
						canDownload ? () => actions.requestOperation({ type: 'download', paths: [entry.path] }) : undefined
					}
					onDraftChange={(content) => actions.setPreviewDraft({ content, path: entry.path })}
					onEditingChange={(editing) => {
						if (editing) actions.setPreviewDraft({ content: viewState.content ?? '', path: entry.path });
						else if (!store.getState().preview.pendingSavePath) actions.setPreviewDraft(undefined);
					}}
					onSave={canEdit ? (content) => requestSave(content) : undefined}
					pending={saving || operationRunning}
					readOnly={!canEdit}
					saveError={saveError}
					showTextHeader={false}
					text={viewState.content}
				/>
			) : null}
		</HeaderContentFooterLayout>
	);
}

export async function readFileManagerPreviewData(
	fileSystem: FileManagerFileSystem,
	path: string,
	maxPreviewBytes: number,
	signal?: AbortSignal,
): Promise<Uint8Array> {
	return readFileViewerBytes(fileSystem, path, maxPreviewBytes, signal);
}

function getFileManagerViewerMimeType(entry: FileManagerFileStat): string | undefined {
	for (const key of ['mimeType', 'type', 'contentType']) {
		if (Object.hasOwn(entry.meta, key) && typeof entry.meta[key] === 'string') return entry.meta[key];
	}
	return undefined;
}

function toFileViewerDescriptor(entry: FileManagerFileStat): FileViewerFileDescriptor {
	return {
		lastModified: entry.mtime,
		meta: entry.meta,
		mimeType: getFileManagerViewerMimeType(entry),
		name: entry.name,
		path: entry.path,
		size: entry.size,
	};
}
