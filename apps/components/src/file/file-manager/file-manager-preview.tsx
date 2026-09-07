'use client';

import { Check, Clipboard } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { readFileViewerBytes } from '@components/file-viewer/file-system-file-viewer';
import { FileViewer } from '@components/file-viewer';
import { toFileViewerKind } from '@components/file-viewer/file-viewer-kind';
import type { FileViewerFileDescriptor, FileViewerKind } from '@components/file-viewer/file-viewer-types';
import { HeaderContentFooterLayout } from '@ui/header-content-footer-layout';
import { cn } from '@/lib/utils';
import { useFileManagerActions, useFileManagerStore, useFileManagerStoreContext } from './file-manager-context';
import type { FileManagerRegistry } from '@components/file-type-registry/file-manager-file-type-types';
import {
	FileManagerFileTypeIcon,
	getFileManagerFileTypeLabel,
	renderFileManagerFileType,
	useFileManagerRegistry,
} from '@components/file-viewer/file-manager-registry';
import type { FileManagerFileStat, FileManagerFileSystem } from './file-manager-types';
import {
	formatFileManagerBytes,
	getFileManagerMimeType,
	sanitizeFileManagerStat,
	toFileManagerFileTypeInput,
} from './file-manager-utils';

export type FileManagerPreviewProps = ComponentPropsWithRef<'div'> & {
	entry?: FileManagerFileStat;
	manager?: FileManagerRegistry;
	maxPreviewBytes?: number;
};

export function FileManagerPreview({
	className,
	entry,
	manager: managerOverride,
	maxPreviewBytes = 512 * 1024,
	...props
}: FileManagerPreviewProps) {
	const manager = useFileManagerRegistry(managerOverride);
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
	const detailEntry = viewState.entry ?? entry;
	const fileTypeInput = detailEntry
		? manager.fileTypes.resolveInput(toFileManagerFileTypeInput(detailEntry))
		: undefined;
	const fileType = fileTypeInput ? manager.fileTypes.resolve(fileTypeInput) : undefined;
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
				const currentFileType = manager.fileTypes.resolve(toFileManagerFileTypeInput(currentEntry));
				const kind = toFileViewerKind(currentFileType);
				if (!currentFileType?.viewer && !currentFileType?.editor) {
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
	}, [entry, fileSystem, manager, maxPreviewBytes]);

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
			detailEntry
				? [
						['类型', fileType && fileTypeInput ? getFileManagerFileTypeLabel(fileType, fileTypeInput) : '文件'],
						['大小', detailEntry.kind === 'directory' ? '—' : formatFileManagerBytes(detailEntry.size)],
						['修改时间', detailEntry.mtime ? new Date(detailEntry.mtime).toLocaleString() : '—'],
					]
				: [],
		[detailEntry, fileType, fileTypeInput],
	);
	const defaultDetail = (
		<dl className='divide-base-300 border-base-300 shrink-0 divide-y border-t text-xs'>
			{metadata.map(([label, value]) => (
				<div key={String(label)} className='grid grid-cols-[5rem_minmax(0,1fr)] gap-2 px-3 py-2'>
					<dt className='text-base-content/70'>{label}</dt>
					<dd className='min-w-0 truncate text-right'>{value}</dd>
				</div>
			))}
		</dl>
	);
	const detail =
		fileType?.detail && fileTypeInput
			? renderFileManagerFileType(fileType.detail, {
					defaultDetail,
					file: fileTypeInput,
					fileType,
				})
			: defaultDetail;

	if (!entry) {
		return (
			<HeaderContentFooterLayout
				className={cn('h-full', className)}
				contentClassName='text-base-content/70 grid place-items-center p-6 text-center text-xs'
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
						<FileManagerFileTypeIcon
							className='size-4'
							file={fileTypeInput ?? toFileManagerFileTypeInput(entry)}
							manager={manager}
						/>
					</div>
					<div className='min-w-0 flex-1'>
						<div className='truncate text-xs font-medium'>{entry.name || '/'}</div>
						<div className='text-base-content/70 truncate font-mono text-[10px]'>{entry.path}</div>
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
			footer={detail}
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
					fileType={fileType}
					manager={manager}
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

function toFileViewerDescriptor(entry: FileManagerFileStat): FileViewerFileDescriptor {
	return {
		lastModified: entry.mtime,
		meta: entry.meta,
		mimeType: getFileManagerMimeType(entry),
		name: entry.name,
		path: entry.path,
		size: entry.size,
	};
}
