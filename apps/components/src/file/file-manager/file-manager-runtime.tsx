'use client';

import { useEffect, useRef } from 'react';
import { useFileManagerStoreContext } from './file-manager-context';
import {
	executeFileManagerOperation,
	FileManagerBatchOperationError,
	FileManagerOperationCancelledError,
} from './file-manager-operation-executor';
import type {
	FileManagerCapabilities,
	FileManagerEvent,
	FileManagerFileStat,
	FileManagerFileSystem,
	FileManagerOperation,
	FileManagerOperationResult,
	FileManagerRequest,
} from './file-manager-types';
import { fileManagerListingHardEntryLimit } from './file-manager-types';
import {
	isFileManagerPathWithinRoot,
	joinFileManagerPath,
	normalizeFileManagerPath,
	validateFileManagerName,
} from './file-manager-utils';

export {
	executeFileManagerOperation,
	FileManagerBatchOperationError,
	FileManagerOperationCancelledError,
} from './file-manager-operation-executor';
export type { ExecuteFileManagerOperationOptions } from './file-manager-operation-executor';

export type FileManagerRuntimeProps = {
	fileSystem: FileManagerFileSystem;
	initialPath?: string;
	maxDownloadBytes?: number;
	maxDownloadTotalBytes?: number;
	maxListingEntries?: number;
	maxUploadBytes?: number;
	maxUploadFiles?: number;
	maxUploadTotalBytes?: number;
	rootPath?: string;
	onDownload?: (entry: FileManagerFileStat, data: Uint8Array) => Promise<void> | void;
	onEvent?: (event: FileManagerEvent) => void;
	onOpenFile?: (entry: FileManagerFileStat, fileSystem: FileManagerFileSystem) => Promise<void> | void;
};

export function FileManagerRuntime({
	fileSystem,
	initialPath,
	maxDownloadBytes = 256 * 1024 * 1024,
	maxDownloadTotalBytes = 512 * 1024 * 1024,
	maxListingEntries = 2_000,
	maxUploadBytes = 100 * 1024 * 1024,
	maxUploadFiles = 256,
	maxUploadTotalBytes = 512 * 1024 * 1024,
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
	const callbacks = useRef({
		maxDownloadBytes,
		maxDownloadTotalBytes,
		maxListingEntries,
		maxUploadBytes,
		maxUploadFiles,
		maxUploadTotalBytes,
		onDownload,
		onEvent,
		onOpenFile,
	});
	callbacks.current = {
		maxDownloadBytes,
		maxDownloadTotalBytes,
		maxListingEntries,
		maxUploadBytes,
		maxUploadFiles,
		maxUploadTotalBytes,
		onDownload,
		onEvent,
		onOpenFile,
	};

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
			if (
				current.operation.status === 'running' &&
				current.operation.active &&
				current.operation.activeRequestId !== undefined
			) {
				current.actions.finishOperation(current.operation.activeRequestId, current.operation.active, 'cancelled');
			}
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
				const maxEntries = normalizeOperationLimit(
					callbacks.current.maxListingEntries,
					2_000,
					fileManagerListingHardEntryLimit,
				);
				state.actions.completeListing(
					requestId,
					path,
					sanitizeFileManagerEntries(entries, path, state.rootPath, maxEntries),
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
			if (request.type === 'cancel-operation') {
				const current = store.getState();
				if (request.fileSystem === current.fileSystem && request.requestId === current.operation.activeRequestId) {
					operationAbort.current?.abort();
				}
				return;
			}
			if (request.type === 'load') {
				await load(request);
				return;
			}
			if (request.type === 'open') {
				const generation = backendGeneration.current;
				if (!isCurrentOpenRequest(request, generation)) return;
				if (request.entry.kind === 'directory') {
					await load({ type: 'load', path: request.entry.path, history: { type: 'push' } });
					return;
				}
				try {
					await callbacks.current.onOpenFile?.(request.entry, request.fileSystem);
					if (!isCurrentOpenRequest(request, generation)) return;
					void events.emit('event', { type: 'opened', entry: request.entry });
				} catch (error) {
					if (!isCurrentOpenRequest(request, generation)) return;
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
			await runOperation(request.requestId, request.operation, request.fileSystem, request.rootPath);
		}

		function isCurrentOpenRequest(request: Extract<FileManagerRequest, { type: 'open' }>, generation: number) {
			const current = store.getState();
			const directory = normalizeFileManagerPath(request.directory);
			return (
				mounted.current &&
				generation === backendGeneration.current &&
				request.fileSystem === current.fileSystem &&
				normalizeFileManagerPath(request.rootPath) === current.rootPath &&
				request.listingRequestId === current.listing.requestId &&
				directory === current.navigation.path &&
				request.entry.directory === directory &&
				isFileManagerPathWithinRoot(request.entry.path, current.rootPath)
			);
		}

		async function runOperation(
			requestId: number,
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
				if (current.operation.status === 'running' && current.operation.activeRequestId === requestId) {
					current.actions.finishOperation(requestId, operation, 'cancelled', { result });
				}
				void events.emit('event', { type: 'operation-cancelled', operation, reason, result });
			};
			try {
				assertOperationCapability(operation, state.capabilities);
				void events.emit('event', { type: 'operation-started', operation });
				const result = await executeFileManagerOperation({
					fileSystem: requestFileSystem,
					maxDownloadBytes: callbacks.current.maxDownloadBytes,
					maxDownloadTotalBytes: callbacks.current.maxDownloadTotalBytes,
					maxUploadBytes: callbacks.current.maxUploadBytes,
					maxUploadFiles: callbacks.current.maxUploadFiles,
					maxUploadTotalBytes: callbacks.current.maxUploadTotalBytes,
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
				state.actions.finishOperation(requestId, operation, 'succeeded', { result });
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
				state.actions.finishOperation(requestId, operation, 'failed', {
					error,
					result: error instanceof FileManagerBatchOperationError ? error.result : undefined,
				});
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
	maxEntries = 2_000,
): FileManagerFileStat[] {
	if (!Array.isArray(entries)) throw new Error('文件系统返回了无效目录列表');
	if (entries.length > maxEntries) throw new Error(`目录项目数量超过列表上限 ${maxEntries}`);
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

function normalizeOperationLimit(value: number, fallback: number, maximum = Number.MAX_SAFE_INTEGER): number {
	return Number.isFinite(value) ? Math.min(maximum, Math.max(0, Math.floor(value))) : fallback;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof FileManagerBatchOperationError) {
		return `${error.message}：${error.result.failed.map((item) => `${item.path} (${getErrorMessage(item.error)})`).join('；')}`;
	}
	return error instanceof Error ? error.message : String(error);
}
