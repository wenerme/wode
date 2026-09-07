import { getFileManagerOperationAdmissionError } from './file-manager-operation-utils';
import type {
	FileManagerFileStat,
	FileManagerFileSystem,
	FileManagerOperation,
	FileManagerOperationResult,
} from './file-manager-types';
import { fileManagerUploadHardFileLimit } from './file-manager-types';
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

export type ExecuteFileManagerOperationOptions = {
	fileSystem: FileManagerFileSystem;
	maxDownloadBytes?: number;
	maxDownloadTotalBytes?: number;
	maxUploadBytes: number;
	maxUploadFiles?: number;
	maxUploadTotalBytes?: number;
	onDownload?: (entry: FileManagerFileStat, data: Uint8Array) => Promise<void> | void;
	operation: FileManagerOperation;
	rootPath: string;
	signal: AbortSignal;
};

export async function executeFileManagerOperation({
	fileSystem,
	maxDownloadBytes = 256 * 1024 * 1024,
	maxDownloadTotalBytes = 512 * 1024 * 1024,
	maxUploadBytes,
	maxUploadFiles = 256,
	maxUploadTotalBytes = 512 * 1024 * 1024,
	onDownload,
	operation,
	rootPath,
	signal,
}: ExecuteFileManagerOperationOptions): Promise<FileManagerOperationResult> {
	const admissionError = getFileManagerOperationAdmissionError(operation);
	if (admissionError) throw new Error(admissionError);
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
		const targetDirectory = await fileSystem.stat(directory, { signal });
		if (targetDirectory.kind !== 'directory') throw new Error('上传目标不是目录');
		const fileLimit = normalizeOperationLimit(maxUploadFiles, 256, fileManagerUploadHardFileLimit);
		const totalLimit = normalizeOperationLimit(maxUploadTotalBytes, 512 * 1024 * 1024);
		const perFileLimit = normalizeOperationLimit(maxUploadBytes, 100 * 1024 * 1024);
		const files = operation.files.slice(0, fileLimit);
		const nameCounts = new Map<string, number>();
		for (const file of files) nameCounts.set(file.name, (nameCounts.get(file.name) ?? 0) + 1);
		const jobs: Array<{ file: File; target: string }> = [];
		let acceptedBytes = 0;
		for (const [index, file] of files.entries()) {
			let target = file.name || `文件 ${index + 1}`;
			try {
				assertName(file.name);
				target = joinFileManagerPath(directory, file.name);
				if ((nameCounts.get(file.name) ?? 0) > 1) throw new Error(`上传列表包含重复文件名：${file.name}`);
				if (!Number.isFinite(file.size) || file.size < 0) throw new Error(`${file.name} 的文件大小无效`);
				if (file.size > perFileLimit)
					throw new Error(`${file.name} 超过单文件上传上限 ${formatBytesForError(perFileLimit)}`);
				if (acceptedBytes + file.size > totalLimit)
					throw new Error(`上传总大小超过上限 ${formatBytesForError(totalLimit)}`);
				acceptedBytes += file.size;
				jobs.push({ file, target });
			} catch (error) {
				result.failed.push({ path: target, error });
			}
		}
		if (operation.files.length > files.length) {
			result.failed.push({
				path: `其余 ${operation.files.length - files.length} 个文件`,
				error: new Error(`上传文件数量超过上限 ${fileLimit}`),
			});
		}
		const rejectedLimit = Math.max(0, fileLimit - files.length);
		const rejectedItems = operation.rejected?.slice(0, rejectedLimit) ?? [];
		for (const rejected of rejectedItems) {
			result.failed.push({
				path: rejected.name,
				error: new Error(formatRejectedUploadReason(rejected.reason)),
			});
		}
		if ((operation.rejected?.length ?? 0) > rejectedItems.length) {
			result.failed.push({
				path: `其余 ${(operation.rejected?.length ?? 0) - rejectedItems.length} 个项目`,
				error: new Error(`拖入项目数量超过上限 ${fileLimit}`),
			});
		}
		await runBatch(
			result,
			jobs,
			async ({ file, target }) => {
				await assertPathsAbsent(fileSystem, [target], signal);
				await fileSystem.writeFile(target, file.stream(), { overwrite: false, signal });
			},
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
	const perDownloadLimit = normalizeOperationLimit(maxDownloadBytes, 256 * 1024 * 1024, 1024 * 1024 * 1024);
	const totalDownloadLimit = normalizeOperationLimit(maxDownloadTotalBytes, 512 * 1024 * 1024, 1024 * 1024 * 1024);
	let downloadedBytes = 0;
	for (const path of operation.paths) {
		const safePath = assertWithinRoot(path, rootPath);
		try {
			const rawEntry = await fileSystem.stat(safePath, { signal });
			const entry = sanitizeFileManagerStat(rawEntry, safePath);
			if (entry.kind === 'directory') continue;
			const remainingBytes = Math.max(0, totalDownloadLimit - downloadedBytes);
			const allowedBytes = Math.min(perDownloadLimit, remainingBytes);
			if (entry.size > allowedBytes) {
				throw new Error(
					entry.size > perDownloadLimit
						? `${entry.name} 超过单文件下载上限 ${formatBytesForError(perDownloadLimit)}`
						: `下载总大小超过上限 ${formatBytesForError(totalDownloadLimit)}`,
				);
			}
			const data = await fileSystem.readFile(safePath, {
				encoding: 'binary',
				maxBytes: allowedBytes + 1,
				signal,
			});
			if (data.byteLength > allowedBytes) {
				throw new Error(
					allowedBytes < perDownloadLimit
						? `下载总大小超过上限 ${formatBytesForError(totalDownloadLimit)}`
						: `${entry.name} 超过单文件下载上限 ${formatBytesForError(perDownloadLimit)}`,
				);
			}
			downloadedBytes += data.byteLength;
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

function normalizeOperationLimit(value: number, fallback: number, maximum = Number.MAX_SAFE_INTEGER): number {
	return Number.isFinite(value) ? Math.min(maximum, Math.max(0, Math.floor(value))) : fallback;
}

function formatRejectedUploadReason(reason: 'directory' | 'too-many' | 'unreadable'): string {
	return reason === 'directory'
		? '暂不支持拖入本地目录'
		: reason === 'too-many'
			? '拖入项目数量超过安全上限'
			: '无法读取拖入项目';
}
