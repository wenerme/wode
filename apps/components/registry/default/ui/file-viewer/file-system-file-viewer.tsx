'use client';

import { AlertCircle, FileText, LoaderCircle } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	AddressableFrame,
	AddressableFrameContent,
	AddressableFrameFooter,
	AddressableFrameHeader,
} from '@/components/ui/addressable-frame';
import { cn } from '@/lib/utils';
import { FileViewer } from './file-viewer';
import { getFileViewerMimeType, resolveFileSystemViewerKind } from './file-viewer-kind';
import type { FileViewerFileDescriptor, FileViewerKind, FileViewerMessages } from './file-viewer-types';
import { formatFileViewerBytes, mergeFileViewerMessages } from './file-viewer-types';

export const defaultFileViewerMaxBytes = 5 * 1024 * 1024;

export type FileViewerFileSystemStat = {
	kind?: 'directory' | 'file';
	meta?: Readonly<Record<string, unknown>>;
	mimeType?: string;
	mtime?: number;
	name?: string;
	path?: string;
	size?: number;
};

export type FileViewerFileSystem = {
	stat?(path: string, options?: { signal?: AbortSignal }): Promise<FileViewerFileSystemStat>;
	readFile?(path: string, options: { encoding: 'binary'; maxBytes: number; signal?: AbortSignal }): Promise<Uint8Array>;
	writeFile?(path: string, data: string, options?: { overwrite?: boolean; signal?: AbortSignal }): Promise<void>;
};

export type LoadedFileViewerFile = {
	bytes?: Uint8Array;
	file: FileViewerFileDescriptor;
	kind: FileViewerKind;
	text?: string;
};

export type LoadFileSystemFileViewerOptions = {
	fileSystem: FileViewerFileSystem;
	maxBytes?: number;
	path: string;
	signal?: AbortSignal;
};

export type FileSystemFileViewerProps = Omit<ComponentPropsWithRef<'section'>, 'children' | 'onError' | 'onLoad'> & {
	fileSystem: FileViewerFileSystem;
	maxBytes?: number;
	messages?: Partial<FileViewerMessages>;
	onError?: (error: unknown) => void;
	onLoad?: (file: LoadedFileViewerFile) => void;
	onDownload?: (file: FileViewerFileDescriptor) => void;
	onTextSaved?: (text: string, file: FileViewerFileDescriptor) => void;
	path: string;
	readOnly?: boolean;
};

type FileSystemFileViewerStateSource = {
	fileSystem: FileViewerFileSystem;
	maxBytes: number;
	path: string;
};

type FileSystemFileViewerState = FileSystemFileViewerStateSource &
	({ status: 'loading' } | { error: unknown; status: 'error' } | { loaded: LoadedFileViewerFile; status: 'ready' });

export function FileSystemFileViewer({
	className,
	fileSystem,
	maxBytes = defaultFileViewerMaxBytes,
	messages: messageOverrides,
	onError,
	onLoad,
	onDownload,
	onTextSaved,
	path,
	readOnly = false,
	...props
}: FileSystemFileViewerProps) {
	const messages = mergeFileViewerMessages(messageOverrides);
	const source = { fileSystem, maxBytes, path };
	const [state, setState] = useState<FileSystemFileViewerState>({ ...source, status: 'loading' });
	const requestId = useRef(0);
	const saveAbort = useRef<AbortController | undefined>(undefined);
	const callbacks = useRef({ onError, onLoad, onTextSaved });
	const loadedRef = useRef<LoadedFileViewerFile | undefined>(undefined);
	const stateIsCurrent = state.fileSystem === fileSystem && Object.is(state.maxBytes, maxBytes) && state.path === path;
	const viewState: FileSystemFileViewerState = stateIsCurrent ? state : { ...source, status: 'loading' };
	callbacks.current = { onError, onLoad, onTextSaved };
	loadedRef.current = viewState.status === 'ready' ? viewState.loaded : undefined;

	useEffect(() => {
		const currentRequestId = requestId.current + 1;
		requestId.current = currentRequestId;
		const controller = new AbortController();
		saveAbort.current?.abort();
		setState({ fileSystem, maxBytes, path, status: 'loading' });
		void loadFileSystemFileViewer({ fileSystem, maxBytes, path, signal: controller.signal }).then(
			(loaded) => {
				if (!isFileViewerRequestCurrent(currentRequestId, requestId.current, controller.signal)) return;
				setState({ fileSystem, loaded, maxBytes, path, status: 'ready' });
				callbacks.current.onLoad?.(loaded);
			},
			(error) => {
				if (!isFileViewerRequestCurrent(currentRequestId, requestId.current, controller.signal)) return;
				setState({ error, fileSystem, maxBytes, path, status: 'error' });
				callbacks.current.onError?.(error);
			},
		);
		return () => {
			controller.abort();
			saveAbort.current?.abort();
		};
	}, [fileSystem, maxBytes, path]);

	const saveText = useCallback(
		async (draft: string) => {
			if (!fileSystem.writeFile) throw new Error('当前文件系统不支持写入');
			const currentRequestId = requestId.current;
			const loadedBeforeWrite = loadedRef.current;
			if (!loadedBeforeWrite || loadedBeforeWrite.file.path !== path) throw createFileViewerAbortError();
			saveAbort.current?.abort();
			const controller = new AbortController();
			saveAbort.current = controller;
			try {
				await fileSystem.writeFile(path, draft, { overwrite: true, signal: controller.signal });
				if (!isFileViewerRequestCurrent(currentRequestId, requestId.current, controller.signal)) {
					throw createFileViewerAbortError();
				}
				const currentLoaded = loadedRef.current;
				if (currentLoaded !== loadedBeforeWrite || currentLoaded.file.path !== path) {
					throw createFileViewerAbortError();
				}
				const savedFile = { ...currentLoaded.file, size: new TextEncoder().encode(draft).byteLength };
				const loaded = { ...currentLoaded, bytes: undefined, file: savedFile, text: draft };
				loadedRef.current = loaded;
				setState({ fileSystem, loaded, maxBytes, path, status: 'ready' });
				callbacks.current.onTextSaved?.(draft, savedFile);
			} finally {
				if (saveAbort.current === controller) saveAbort.current = undefined;
			}
		},
		[fileSystem, maxBytes, path],
	);

	const title = viewState.status === 'ready' ? viewState.loaded.file.name : getRequestedFileViewerName(path);
	const description = viewState.status === 'ready' ? viewState.loaded.file.path : path;
	return (
		<AddressableFrame className={cn('min-h-72', className)} {...props}>
			<AddressableFrameHeader
				title={title}
				description={description}
				actions={
					viewState.status === 'loading' ? (
						<LoaderCircle aria-hidden='true' className='size-4 animate-spin' />
					) : undefined
				}
			>
				<FileText aria-hidden='true' className='text-base-content/55 mt-0.5 size-4 shrink-0' />
			</AddressableFrameHeader>
			<AddressableFrameContent className='bg-base-100'>
				{viewState.status === 'loading' ? (
					<div role='status' className='text-base-content/60 grid min-h-64 place-items-center p-5 text-sm'>
						<span className='inline-flex items-center gap-2'>
							<LoaderCircle aria-hidden='true' className='size-4 animate-spin' />
							{messages.loading}
						</span>
					</div>
				) : viewState.status === 'error' ? (
					<div role='alert' className='text-error grid min-h-64 place-items-center p-5 text-center text-sm'>
						<div className='max-w-md'>
							<AlertCircle aria-hidden='true' className='mx-auto mb-2 size-5' />
							{viewState.error instanceof FileViewerSizeLimitError
								? messages.fileTooLarge(viewState.error.maxBytes)
								: messages.loadFailed(viewState.error)}
						</div>
					</div>
				) : (
					<FileViewer
						key={path}
						bytes={viewState.loaded.bytes}
						file={viewState.loaded.file}
						kind={viewState.loaded.kind}
						messages={messages}
						onDownload={onDownload}
						onSave={!readOnly && fileSystem.writeFile && viewState.loaded.kind === 'text' ? saveText : undefined}
						readOnly={readOnly || !fileSystem.writeFile}
						text={viewState.loaded.text}
					/>
				)}
			</AddressableFrameContent>
			{viewState.status === 'ready' ? (
				<AddressableFrameFooter>
					<span>
						{viewState.loaded.file.mimeType || getFileViewerMimeType(viewState.loaded.file, viewState.loaded.kind)}
					</span>
					<span aria-hidden='true'>·</span>
					<span>{formatFileViewerBytes(viewState.loaded.file.size)}</span>
				</AddressableFrameFooter>
			) : null}
		</AddressableFrame>
	);
}

export async function loadFileSystemFileViewer({
	fileSystem,
	maxBytes = defaultFileViewerMaxBytes,
	path,
	signal,
}: LoadFileSystemFileViewerOptions): Promise<LoadedFileViewerFile> {
	throwIfFileViewerAborted(signal);
	const stat = fileSystem.stat ? await fileSystem.stat(path, { signal }) : undefined;
	throwIfFileViewerAborted(signal);
	if (stat?.kind === 'directory') throw new Error('预览目标不是文件');
	const file = createAuthoritativeFileDescriptor(path, stat);
	const kind = resolveFileSystemViewerKind(file);
	if (kind === 'unsupported') return { file, kind };
	const limit = normalizeFileViewerMaxBytes(maxBytes);
	if (file.size !== undefined && file.size > limit) throw new FileViewerSizeLimitError(limit, file.size);
	if (!fileSystem.readFile) throw new Error('当前文件系统不支持读取文件');
	const bytes = await readFileViewerBytes(fileSystem, path, limit, signal);
	const actualFile = { ...file, size: bytes.byteLength };
	return kind === 'text'
		? { file: actualFile, kind, text: new TextDecoder().decode(bytes) }
		: { bytes, file: actualFile, kind };
}

export async function readFileViewerBytes(
	fileSystem: Pick<FileViewerFileSystem, 'readFile'>,
	path: string,
	maxBytes: number,
	signal?: AbortSignal,
): Promise<Uint8Array> {
	if (!fileSystem.readFile) throw new Error('当前文件系统不支持读取文件');
	const limit = normalizeFileViewerMaxBytes(maxBytes);
	throwIfFileViewerAborted(signal);
	const bytes = await fileSystem.readFile(path, { encoding: 'binary', maxBytes: limit + 1, signal });
	throwIfFileViewerAborted(signal);
	if (!(bytes instanceof Uint8Array)) throw new TypeError('文件系统 readFile 必须返回 Uint8Array');
	if (bytes.byteLength > limit) throw new FileViewerSizeLimitError(limit, bytes.byteLength);
	return bytes;
}

export class FileViewerSizeLimitError extends Error {
	constructor(
		public readonly maxBytes: number,
		public readonly actualBytes: number,
	) {
		super(`文件超过预览上限 ${formatFileViewerBytes(maxBytes)}`);
		this.name = 'FileViewerSizeLimitError';
	}
}

export function normalizeFileViewerMaxBytes(maxBytes: number): number {
	return Number.isFinite(maxBytes)
		? Math.min(Number.MAX_SAFE_INTEGER - 1, Math.max(0, Math.floor(maxBytes)))
		: defaultFileViewerMaxBytes;
}

export function isFileViewerRequestCurrent(
	requestId: number,
	currentRequestId: number,
	signal?: Pick<AbortSignal, 'aborted'>,
): boolean {
	return requestId === currentRequestId && !signal?.aborted;
}

export function createAuthoritativeFileDescriptor(
	path: string,
	stat?: FileViewerFileSystemStat,
): FileViewerFileDescriptor {
	const mimeType = getStatMimeType(stat);
	return {
		name: getRequestedFileViewerName(path) || stat?.name || path,
		path,
		mimeType,
		size: typeof stat?.size === 'number' && Number.isFinite(stat.size) && stat.size >= 0 ? stat.size : undefined,
		lastModified: typeof stat?.mtime === 'number' && Number.isFinite(stat.mtime) ? stat.mtime : undefined,
		meta: stat?.meta,
	};
}

export function getRequestedFileViewerName(path: string): string {
	const clean = path.replaceAll('\\', '/').replace(/\/+$/, '');
	return clean.slice(clean.lastIndexOf('/') + 1) || path;
}

function getStatMimeType(stat: FileViewerFileSystemStat | undefined): string | undefined {
	if (typeof stat?.mimeType === 'string') return stat.mimeType;
	const meta = stat?.meta;
	if (!meta) return undefined;
	for (const key of ['mimeType', 'type', 'contentType']) {
		if (Object.hasOwn(meta, key) && typeof meta[key] === 'string') return meta[key];
	}
	return undefined;
}

function throwIfFileViewerAborted(signal?: AbortSignal) {
	if (signal?.aborted) throw createFileViewerAbortError();
}

function createFileViewerAbortError(): Error {
	const error = new Error('文件读取已取消');
	error.name = 'AbortError';
	return error;
}
