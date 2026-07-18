'use client';

import { useEffect, useRef } from 'react';
import { useFileManagerStoreContext } from './file-manager-context';
import type {
	FileManagerCapabilities,
	FileManagerEvent,
	FileManagerFileStat,
	FileManagerFileSystem,
	FileManagerOperation,
	FileManagerOperationResult,
	FileManagerRequest,
} from './file-manager-types';
import {
	getFileManagerBasename,
	getFileManagerParentPath,
	isFileManagerDescendantPath,
	isFileManagerPathWithinRoot,
	joinFileManagerPath,
	normalizeFileManagerPath,
	sanitizeFileManagerStat,
	validateFileManagerName,
} from './file-manager-utils';

export type FileManagerRuntimeProps = {
	fileSystem: FileManagerFileSystem;
	initialPath?: string;
	maxUploadBytes?: number;
	rootPath?: string;
	onDownload?: (entry: FileManagerFileStat, data: Uint8Array) => Promise<void> | void;
	onEvent?: (event: FileManagerEvent) => void;
	onOpenFile?: (entry: FileManagerFileStat, fileSystem: FileManagerFileSystem) => Promise<void> | void;
};

export function FileManagerRuntime({
	fileSystem,
	initialPath,
	maxUploadBytes = 100 * 1024 * 1024,
	rootPath = '/',
	onDownload,
	onEvent,
	onOpenFile,
}: FileManagerRuntimeProps) {
	const store = useFileManagerStoreContext();
	const listingAbort = useRef<AbortController | null>(null);
	const operationAbort = useRef<AbortController | null>(null);
	const backendGeneration = useRef(0);
	const mounted = useRef(true);
	const callbacks = useRef({ maxUploadBytes, onDownload, onEvent, onOpenFile });
	callbacks.current = { maxUploadBytes, onDownload, onEvent, onOpenFile };

	useEffect(() => {
		mounted.current = true;
		backendGeneration.current += 1;
		listingAbort.current?.abort();
		operationAbort.current?.abort();
		const state = store.getState();
		if (state.fileSystem !== fileSystem || state.rootPath !== normalizeFileManagerPath(rootPath)) {
			state.actions.replaceFileSystem(fileSystem, rootPath, initialPath);
		}
		return () => {
			mounted.current = false;
			backendGeneration.current += 1;
			const current = store.getState();
			if (current.operation.status === 'running') current.actions.finishOperation(undefined, 'cancelled');
			listingAbort.current?.abort();
			operationAbort.current?.abort();
		};
	}, [fileSystem, initialPath, rootPath, store]);

	useEffect(() => {
		const events = store.getState().events;
		const offEvent = events.on('event', ({ data }) => callbacks.current.onEvent?.(data));
		const offRequest = events.on('request', ({ data }) => void handleRequest(data));

		async function load(request: Extract<FileManagerRequest, { type: 'load' }>) {
			const state = store.getState();
			const generation = backendGeneration.current;
			const path = normalizeFileManagerPath(request.path);
			if (!isFileManagerPathWithinRoot(path, state.rootPath)) {
				const error = new Error(`Path escapes root: ${path}`);
				void events.emit('event', { type: 'error', action: 'navigate', error });
				return;
			}
			listingAbort.current?.abort();
			const controller = new AbortController();
			listingAbort.current = controller;
			const requestId = state.actions.beginListing(path);
			try {
				const entries = await state.fileSystem.readdir(path, { signal: controller.signal });
				if (!isCurrent(generation, controller.signal)) return;
				state.actions.completeListing(
					requestId,
					path,
					sanitizeFileManagerEntries(entries, path, state.rootPath),
					request.history,
				);
			} catch (error) {
				if (!isCurrent(generation, controller.signal)) return;
				if (state.actions.failListing(requestId, getErrorMessage(error))) {
					void events.emit('event', { type: 'error', action: 'navigate', error });
				}
			}
		}

		function isCurrent(generation: number, signal: AbortSignal) {
			return mounted.current && !signal.aborted && generation === backendGeneration.current;
		}

		async function handleRequest(request: FileManagerRequest) {
			if (request.type === 'load') {
				await load(request);
				return;
			}
			if (request.type === 'open') {
				if (request.entry.kind === 'directory') {
					await load({ type: 'load', path: request.entry.path, history: { type: 'push' } });
					return;
				}
				try {
					await callbacks.current.onOpenFile?.(request.entry, store.getState().fileSystem);
					void events.emit('event', { type: 'opened', entry: request.entry });
				} catch (error) {
					void events.emit('event', { type: 'open-failed', entry: request.entry, error });
					void events.emit('event', { type: 'error', action: 'open', error });
				}
				return;
			}
			const state = store.getState();
			if (request.fileSystem !== state.fileSystem || request.rootPath !== state.rootPath) {
				void events.emit('event', {
					type: 'operation-cancelled',
					operation: request.operation,
					reason: 'backend-changed',
				});
				return;
			}
			await runOperation(request.operation, request.fileSystem, request.rootPath);
		}

		async function runOperation(
			operation: FileManagerOperation,
			requestFileSystem: FileManagerFileSystem,
			requestRootPath: string,
		) {
			const state = store.getState();
			const generation = backendGeneration.current;
			operationAbort.current?.abort();
			const controller = new AbortController();
			operationAbort.current = controller;
			let terminal = false;
			const cancel = (reason: 'aborted' | 'backend-changed', result?: FileManagerOperationResult) => {
				if (terminal) return;
				terminal = true;
				const current = store.getState();
				if (current.operation.status === 'running' && current.operation.kind === operation.type) {
					current.actions.finishOperation(undefined, 'cancelled');
				}
				void events.emit('event', { type: 'operation-cancelled', operation, reason, result });
			};
			try {
				assertOperationCapability(operation, state.capabilities);
				void events.emit('event', { type: 'operation-started', operation });
				const result = await executeFileManagerOperation({
					fileSystem: requestFileSystem,
					maxUploadBytes: callbacks.current.maxUploadBytes,
					onDownload: callbacks.current.onDownload,
					operation,
					rootPath: requestRootPath,
					signal: controller.signal,
				});
				if (!isCurrent(generation, controller.signal)) {
					cancel(generation === backendGeneration.current ? 'aborted' : 'backend-changed', result);
					return;
				}
				terminal = true;
				state.actions.finishOperation(undefined, 'succeeded');
				void events.emit('event', { type: 'operation-succeeded', operation, result });
				await load({ type: 'load', path: store.getState().navigation.path, history: { type: 'none' } });
			} catch (error) {
				if (!isCurrent(generation, controller.signal)) {
					cancel(
						generation === backendGeneration.current ? 'aborted' : 'backend-changed',
						error instanceof FileManagerOperationCancelledError ? error.result : undefined,
					);
					return;
				}
				if (error instanceof FileManagerOperationCancelledError) {
					cancel('aborted', error.result);
					return;
				}
				terminal = true;
				state.actions.finishOperation(getErrorMessage(error), 'failed');
				void events.emit('event', {
					type: 'operation-failed',
					operation,
					error,
					result: error instanceof FileManagerBatchOperationError ? error.result : undefined,
				});
				void events.emit('event', { type: 'error', action: operation.type, error });
				if (operation.type !== 'download' && operation.type !== 'save-text') {
					await load({ type: 'load', path: store.getState().navigation.path, history: { type: 'none' } });
				}
			}
		}

		void handleRequest({ type: 'load', path: store.getState().navigation.path, history: { type: 'replace' } });
		return () => {
			offEvent();
			offRequest();
			listingAbort.current?.abort();
			operationAbort.current?.abort();
		};
	}, [store]);

	return null;
}

export function sanitizeFileManagerEntries(
	entries: FileManagerFileStat[],
	directory: string,
	rootPath: string,
): FileManagerFileStat[] {
	const normalizedDirectory = normalizeFileManagerPath(directory);
	const names = new Set<string>();
	return entries.map((entry) => {
		if (validateFileManagerName(entry.name)) throw new Error(`文件系统返回了非法项目名称：${entry.name}`);
		if (names.has(entry.name)) throw new Error(`文件系统返回了重复项目：${entry.name}`);
		names.add(entry.name);
		if (entry.kind !== 'directory' && entry.kind !== 'file')
			throw new Error(`文件系统返回了非法项目类型：${entry.name}`);
		const path = joinFileManagerPath(normalizedDirectory, entry.name);
		if (!isFileManagerPathWithinRoot(path, rootPath)) throw new Error(`文件系统项目超出根目录：${entry.name}`);
		return {
			directory: normalizedDirectory,
			kind: entry.kind,
			meta: entry.meta ?? {},
			mtime: Number.isFinite(entry.mtime) ? entry.mtime : 0,
			name: entry.name,
			path,
			size: Number.isFinite(entry.size) && entry.size > 0 ? entry.size : 0,
		};
	});
}

function assertOperationCapability(operation: FileManagerOperation, capabilities: FileManagerCapabilities) {
	const capability: keyof FileManagerCapabilities = {
		copy: 'copy',
		'create-directory': 'createDirectory',
		'create-file': 'createFile',
		delete: 'delete',
		download: 'download',
		move: 'move',
		rename: 'rename',
		'save-text': 'edit',
		upload: 'upload',
	}[operation.type] as keyof FileManagerCapabilities;
	if (!capabilities[capability]) throw new Error(`Operation is disabled: ${operation.type}`);
}

export type ExecuteFileManagerOperationOptions = {
	fileSystem: FileManagerFileSystem;
	maxUploadBytes: number;
	onDownload?: (entry: FileManagerFileStat, data: Uint8Array) => Promise<void> | void;
	operation: FileManagerOperation;
	rootPath: string;
	signal: AbortSignal;
};

export async function executeFileManagerOperation({
	fileSystem,
	maxUploadBytes,
	onDownload,
	operation,
	rootPath,
	signal,
}: ExecuteFileManagerOperationOptions): Promise<FileManagerOperationResult> {
	const result: FileManagerOperationResult = { completed: [], failed: [] };
	if (operation.type === 'create-directory' || operation.type === 'create-file') {
		assertName(operation.name);
		const path = assertWithinRoot(joinFileManagerPath(operation.directory, operation.name), rootPath);
		await assertPathsAbsent(fileSystem, [path], signal);
		if (operation.type === 'create-directory') await fileSystem.mkdir(path, { recursive: false, signal });
		else await fileSystem.writeFile(path, '', { overwrite: false, signal });
		result.completed.push(path);
		return result;
	}
	if (operation.type === 'rename') {
		assertName(operation.name);
		const source = assertMutablePath(operation.path, rootPath);
		const destination = assertWithinRoot(
			joinFileManagerPath(getFileManagerParentPath(source), operation.name),
			rootPath,
		);
		if (source !== destination) {
			await fileSystem.stat(source, { signal });
			await assertPathsAbsent(fileSystem, [destination], signal);
			await fileSystem.rename(source, destination, { overwrite: false, signal });
		}
		result.completed.push(source);
		return result;
	}
	if (operation.type === 'copy' || operation.type === 'move') {
		const destination = assertWithinRoot(operation.destination, rootPath);
		const target = await fileSystem.stat(destination, { signal });
		if (target.kind !== 'directory') throw new Error('目标位置不是目录');
		const jobs: Array<{ source: string; target: string }> = [];
		for (const requestedPath of operation.paths) {
			const source = assertMutablePath(requestedPath, rootPath);
			await fileSystem.stat(source, { signal });
			if (source === destination || isFileManagerDescendantPath(source, destination)) {
				throw new Error('不能将项目复制或移动到自身内部');
			}
			const nextPath = joinFileManagerPath(destination, getFileManagerBasename(source));
			if (nextPath !== source) jobs.push({ source, target: nextPath });
		}
		if (new Set(jobs.map((job) => job.target)).size !== jobs.length) throw new Error('多个项目会写入同一个目标路径');
		await assertPathsAbsent(
			fileSystem,
			jobs.map((job) => job.target),
			signal,
		);
		await runBatch(
			result,
			jobs,
			async ({ source, target: targetPath }) => {
				if (operation.type === 'copy') await fileSystem.copy(source, targetPath, { overwrite: false, signal });
				else await fileSystem.rename(source, targetPath, { overwrite: false, signal });
			},
			(job) => job.source,
			signal,
		);
		return result;
	}
	if (operation.type === 'delete') {
		const paths = operation.paths.map((path) => assertMutablePath(path, rootPath));
		await Promise.all(paths.map((path) => fileSystem.stat(path, { signal })));
		await runBatch(
			result,
			paths,
			(path) => fileSystem.rm(path, { recursive: true, signal }),
			(path) => path,
			signal,
		);
		return result;
	}
	if (operation.type === 'upload') {
		const directory = assertWithinRoot(operation.directory, rootPath);
		const targets = operation.files.map((file) => {
			assertName(file.name);
			if (file.size > maxUploadBytes)
				throw new Error(`${file.name} 超过上传上限 ${formatBytesForError(maxUploadBytes)}`);
			return joinFileManagerPath(directory, file.name);
		});
		if (new Set(targets).size !== targets.length) throw new Error('上传列表包含重复文件名');
		await assertPathsAbsent(fileSystem, targets, signal);
		const jobs = operation.files.map((file, index) => ({ file, target: targets[index] }));
		await runBatch(
			result,
			jobs,
			({ file, target }) => fileSystem.writeFile(target, file.stream(), { overwrite: false, signal }),
			(job) => job.target,
			signal,
		);
		return result;
	}
	if (operation.type === 'save-text') {
		const path = assertMutablePath(operation.path, rootPath);
		await fileSystem.writeFile(path, operation.content, { overwrite: true, signal });
		result.completed.push(path);
		return result;
	}
	for (const path of operation.paths) {
		const safePath = assertWithinRoot(path, rootPath);
		try {
			const rawEntry = await fileSystem.stat(safePath, { signal });
			const entry = sanitizeFileManagerStat(rawEntry, safePath);
			if (entry.kind === 'directory') continue;
			const data = await fileSystem.readFile(safePath, { encoding: 'binary', signal });
			if (onDownload) await onDownload(entry, data);
			else downloadInBrowser(entry, data);
			result.completed.push(safePath);
		} catch (error) {
			if (isAbortError(error) || signal.aborted) throw new FileManagerOperationCancelledError(result, error);
			result.failed.push({ path: safePath, error });
		}
	}
	if (result.failed.length) throw new FileManagerBatchOperationError(result);
	return result;
}

export class FileManagerBatchOperationError extends Error {
	constructor(public readonly result: FileManagerOperationResult) {
		super(`${result.failed.length} 个项目处理失败`);
		this.name = 'FileManagerBatchOperationError';
	}
}

export class FileManagerOperationCancelledError extends Error {
	constructor(
		public readonly result: FileManagerOperationResult,
		cause?: unknown,
	) {
		super('文件操作已取消', { cause });
		this.name = 'FileManagerOperationCancelledError';
	}
}

async function runBatch<T>(
	result: FileManagerOperationResult,
	items: readonly T[],
	run: (item: T) => Promise<void>,
	getPath: (item: T) => string,
	signal: AbortSignal,
) {
	for (const item of items) {
		const path = getPath(item);
		try {
			await run(item);
			result.completed.push(path);
		} catch (error) {
			if (isAbortError(error) || signal.aborted) throw new FileManagerOperationCancelledError(result, error);
			result.failed.push({ path, error });
		}
	}
	if (result.failed.length) throw new FileManagerBatchOperationError(result);
}

async function assertPathsAbsent(fileSystem: FileManagerFileSystem, paths: readonly string[], signal: AbortSignal) {
	for (const path of paths) {
		try {
			await fileSystem.stat(path, { signal });
		} catch (error) {
			if (isNotFoundError(error)) continue;
			throw error;
		}
		throw new Error(`目标已存在：${path}`);
	}
}

function isNotFoundError(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function isAbortError(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

function assertName(name: string) {
	const error = validateFileManagerName(name);
	if (error) throw new Error(error);
}

function assertWithinRoot(path: string, rootPath: string): string {
	const normalized = normalizeFileManagerPath(path);
	if (!isFileManagerPathWithinRoot(normalized, rootPath)) throw new Error(`路径超出根目录：${normalized}`);
	return normalized;
}

function assertMutablePath(path: string, rootPath: string): string {
	const normalized = assertWithinRoot(path, rootPath);
	if (normalized === normalizeFileManagerPath(rootPath)) throw new Error('不能修改文件管理器根目录');
	return normalized;
}

function downloadInBrowser(entry: FileManagerFileStat, data: Uint8Array) {
	if (typeof document === 'undefined' || typeof URL === 'undefined') throw new Error('当前运行时不支持浏览器下载');
	const url = URL.createObjectURL(new Blob([data.slice().buffer]));
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = entry.name;
	anchor.click();
	queueMicrotask(() => URL.revokeObjectURL(url));
}

function formatBytesForError(bytes: number): string {
	return `${Math.max(1, Math.round(bytes / 1024 / 1024))} MB`;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof FileManagerBatchOperationError) {
		return `${error.message}：${error.result.failed.map((item) => `${item.path} (${getErrorMessage(item.error)})`).join('；')}`;
	}
	return error instanceof Error ? error.message : String(error);
}
