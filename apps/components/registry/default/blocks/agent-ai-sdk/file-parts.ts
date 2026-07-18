import type { FileUIPart } from 'ai';
import { isAbortError } from './safe-error';

export const AGENT_RUNTIME_DEFAULT_MAX_FILES = 5;
export const AGENT_RUNTIME_DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const AGENT_RUNTIME_DEFAULT_MAX_TOTAL_SIZE = 20 * 1024 * 1024;

export type AgentRuntimeFileLimits = {
	maxFileSize?: number;
	maxFiles?: number;
	maxTotalSize?: number;
};

export type AgentRuntimeResolvedFileLimits = {
	maxFileSize: number;
	maxFiles: number;
	maxTotalSize: number;
};

export class AgentRuntimeFileError extends Error {
	readonly code: 'aborted' | 'file-count' | 'file-read' | 'file-size' | 'total-size' | 'unsupported-type';
	readonly file?: File;

	constructor(code: AgentRuntimeFileError['code'], message: string, file?: File) {
		super(message);
		this.name = 'AgentRuntimeFileError';
		this.code = code;
		this.file = file;
	}
}

export function resolveAgentRuntimeFileLimits(limits: AgentRuntimeFileLimits = {}): AgentRuntimeResolvedFileLimits {
	return {
		maxFiles: resolveLimit(limits.maxFiles, AGENT_RUNTIME_DEFAULT_MAX_FILES, 20),
		maxFileSize: resolveLimit(limits.maxFileSize, AGENT_RUNTIME_DEFAULT_MAX_FILE_SIZE, 64 * 1024 * 1024),
		maxTotalSize: resolveLimit(limits.maxTotalSize, AGENT_RUNTIME_DEFAULT_MAX_TOTAL_SIZE, 128 * 1024 * 1024),
	};
}

export async function convertAgentFilesToUIParts(
	files: readonly File[],
	limits: AgentRuntimeFileLimits = {},
	signal?: AbortSignal,
): Promise<FileUIPart[]> {
	const resolved = resolveAgentRuntimeFileLimits(limits);
	validateFiles(files, resolved);
	if (signal?.aborted) throw abortedError();
	const parts: FileUIPart[] = [];
	for (const file of files) {
		if (signal?.aborted) throw abortedError();
		parts.push({
			type: 'file',
			filename: file.name || undefined,
			mediaType: resolveMediaType(file),
			url: await readFileAsDataUrl(file, signal),
		});
	}
	return parts;
}

function validateFiles(files: readonly File[], limits: AgentRuntimeResolvedFileLimits) {
	if (files.length > limits.maxFiles) {
		throw new AgentRuntimeFileError('file-count', `最多发送 ${limits.maxFiles} 个附件。`);
	}
	let total = 0;
	for (const file of files) {
		if (!Number.isFinite(file.size) || file.size < 0 || file.size > limits.maxFileSize) {
			throw new AgentRuntimeFileError('file-size', `${file.name || '未命名文件'} 超过单个附件大小限制。`, file);
		}
		const mediaType = resolveMediaType(file);
		const topLevel = mediaType.split('/', 1)[0];
		if (topLevel !== 'application' && topLevel !== 'audio' && topLevel !== 'image' && topLevel !== 'text') {
			throw new AgentRuntimeFileError('unsupported-type', `${file.name || '未命名文件'} 的类型不受支持。`, file);
		}
		total += file.size;
		if (total > limits.maxTotalSize) {
			throw new AgentRuntimeFileError('total-size', '附件总大小超过限制。');
		}
	}
}

function resolveMediaType(file: File): string {
	return file.type.trim().toLowerCase() || 'application/octet-stream';
}

function readFileAsDataUrl(file: File, signal?: AbortSignal): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		const abort = () => reader.abort();
		const cleanup = () => signal?.removeEventListener('abort', abort);
		signal?.addEventListener('abort', abort, { once: true });
		reader.onload = () => {
			cleanup();
			if (typeof reader.result === 'string') resolve(reader.result);
			else reject(new AgentRuntimeFileError('file-read', `无法读取 ${file.name || '附件'}。`, file));
		};
		reader.onerror = () => {
			cleanup();
			reject(new AgentRuntimeFileError('file-read', `无法读取 ${file.name || '附件'}。`, file));
		};
		reader.onabort = () => {
			cleanup();
			reject(abortedError());
		};
		try {
			reader.readAsDataURL(file);
		} catch (error) {
			cleanup();
			reject(
				isAbortError(error)
					? abortedError()
					: new AgentRuntimeFileError('file-read', `无法读取 ${file.name || '附件'}。`, file),
			);
		}
	});
}

function abortedError() {
	return new AgentRuntimeFileError('aborted', '附件读取已取消。');
}

function resolveLimit(value: number | undefined, fallback: number, maximum: number) {
	return Number.isFinite(value) && value !== undefined && value > 0 ? Math.min(Math.floor(value), maximum) : fallback;
}
