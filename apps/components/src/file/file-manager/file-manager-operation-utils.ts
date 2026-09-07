import type {
	FileManagerOperation,
	FileManagerOperationFeedback,
	FileManagerOperationResult,
} from './file-manager-types';
import { fileManagerOperationHardItemLimit, fileManagerUploadHardFileLimit } from './file-manager-types';
import { getFileManagerParentPath, joinFileManagerPath, normalizeFileManagerPath } from './file-manager-utils';

export type FileManagerOperationRefreshPlan = {
	directories: string[];
	removedPaths: string[];
};

export function getFileManagerOperationRefreshPlan(
	operation: FileManagerOperation,
	result: FileManagerOperationResult | undefined,
): FileManagerOperationRefreshPlan {
	if (!result?.completed.length || operation.type === 'download') return { directories: [], removedPaths: [] };
	const directories = new Set<string>();
	const removedPaths = new Set<string>();
	if (operation.type === 'create-directory' || operation.type === 'create-file' || operation.type === 'upload') {
		directories.add(normalizeFileManagerPath(operation.directory));
	} else if (operation.type === 'copy') {
		directories.add(normalizeFileManagerPath(operation.destination));
	} else if (operation.type === 'move') {
		directories.add(normalizeFileManagerPath(operation.destination));
		for (const path of result.completed) {
			const normalized = normalizeFileManagerPath(path);
			directories.add(getFileManagerParentPath(normalized));
			removedPaths.add(normalized);
		}
	} else if (operation.type === 'delete') {
		for (const path of result.completed) {
			const normalized = normalizeFileManagerPath(path);
			directories.add(getFileManagerParentPath(normalized));
			removedPaths.add(normalized);
		}
	} else if (operation.type === 'rename') {
		const source = normalizeFileManagerPath(operation.path);
		const directory = getFileManagerParentPath(source);
		directories.add(directory);
		if (joinFileManagerPath(directory, operation.name) !== source) removedPaths.add(source);
	} else {
		for (const path of result.completed) directories.add(getFileManagerParentPath(path));
	}
	return { directories: [...directories], removedPaths: [...removedPaths] };
}

export type FileManagerOperationErrorInfo = {
	detail?: string;
	title: string;
};

export function collectFileManagerUploadFiles(files: {
	readonly [index: number]: File | undefined;
	readonly length: number;
}): Pick<Extract<FileManagerOperation, { type: 'upload' }>, 'files' | 'rejected'> {
	const overLimit = files.length > fileManagerUploadHardFileLimit;
	const limit = Math.min(files.length, fileManagerUploadHardFileLimit - (overLimit ? 1 : 0));
	const selected: File[] = [];
	for (let index = 0; index < limit; index += 1) {
		const file = files[index];
		if (file) selected.push(file);
	}
	const omitted = files.length - selected.length;
	return {
		files: selected,
		rejected: omitted ? [{ name: `其余 ${omitted} 个项目`, reason: 'too-many' }] : undefined,
	};
}

export function getFileManagerOperationAdmissionError(operation: FileManagerOperation): string | undefined {
	if ('paths' in operation && operation.paths.length > fileManagerOperationHardItemLimit) {
		return `单次操作最多处理 ${fileManagerOperationHardItemLimit} 个项目`;
	}
	return undefined;
}

export function normalizeRequestedFileManagerOperation(operation: FileManagerOperation): FileManagerOperation {
	if (operation.type !== 'upload') return operation;
	const rejected = operation.rejected ?? [];
	if (operation.files.length + rejected.length <= fileManagerUploadHardFileLimit) return operation;
	const files = operation.files.slice(0, fileManagerUploadHardFileLimit - 1);
	const rejectedItems = rejected.slice(0, Math.max(0, fileManagerUploadHardFileLimit - files.length - 1));
	const omitted = operation.files.length - files.length + rejected.length - rejectedItems.length;
	return {
		...operation,
		files,
		rejected: [...rejectedItems, { name: `其余 ${omitted} 个项目`, reason: 'too-many' }],
	};
}

export function createFileManagerRetryOperation(
	feedback: FileManagerOperationFeedback,
): FileManagerOperation | undefined {
	const { operation, result } = feedback;
	if (!result) return operation;
	const completed = new Set(result.completed);
	if (operation.type === 'upload') {
		const files = operation.files
			.slice(0, fileManagerUploadHardFileLimit)
			.filter((file) => !completed.has(joinFileManagerPath(operation.directory, file.name)));
		return files.length ? { ...operation, files, rejected: undefined } : undefined;
	}
	if (
		operation.type === 'copy' ||
		operation.type === 'move' ||
		operation.type === 'delete' ||
		operation.type === 'download'
	) {
		const paths = operation.paths.filter((path) => !completed.has(path));
		return paths.length ? { ...operation, paths } : undefined;
	}
	if (operation.type === 'create-directory' || operation.type === 'create-file') {
		const path = joinFileManagerPath(operation.directory, operation.name);
		return completed.has(path) ? undefined : operation;
	}
	if (operation.type === 'save-text') return completed.has(operation.path) ? undefined : operation;
	return completed.has(operation.path) ? undefined : operation;
}

export function formatFileManagerOperationError(error: unknown): FileManagerOperationErrorInfo {
	const name = getErrorProperty(error, 'name');
	const code = getErrorProperty(error, 'code');
	const message = error instanceof Error ? error.message : String(error);
	if (name === 'AbortError') return { title: '操作已取消' };
	if (name === 'NotAllowedError' || name === 'SecurityError' || code === 'EACCES' || code === 'EPERM') {
		return { title: '没有完成此操作的权限' };
	}
	if (name === 'QuotaExceededError' || code === 'ENOSPC') return { title: '存储空间不足' };
	if (code === 'ENOENT' || /不存在|not found/i.test(message)) return { title: '文件或目标目录不存在' };
	if (code === 'EEXIST' || /目标已存在|already exists/i.test(message)) return { title: '目标中已存在同名项目' };
	if (name === 'NotSupportedError') return { title: '当前文件系统不支持此操作' };
	if (/超过.*上限|too large/i.test(message)) return { title: '文件超出上传限制', detail: message };
	if (/暂不支持拖入本地目录/.test(message)) return { title: '暂不支持上传本地目录' };
	return { title: message || '文件操作失败' };
}

export function getFileManagerOperationResultCount(result: FileManagerOperationResult | undefined) {
	return { completed: result?.completed.length ?? 0, failed: result?.failed.length ?? 0 };
}

function getErrorProperty(error: unknown, property: 'code' | 'name'): string | undefined {
	if (typeof error !== 'object' || error === null || !(property in error)) return undefined;
	const value = (error as Record<string, unknown>)[property];
	return typeof value === 'string' ? value : undefined;
}
