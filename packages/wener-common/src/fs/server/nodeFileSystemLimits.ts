import { lstatSync } from 'node:fs';
import path from 'node:path';
import { FileSystemError } from '../FileSystemError';

type NodeFsPromises = typeof import('node:fs/promises');

export async function assertNodePathHasNoSymlink(options: {
	allowMissing?: boolean;
	fs: NodeFsPromises;
	path: string;
	root: string;
}): Promise<void> {
	if (!options.root) return;
	for (const candidate of nodePathSegments(options.root, options.path)) {
		try {
			const stat = await options.fs.lstat(candidate);
			if (stat.isSymbolicLink()) throw symlinkError(candidate);
		} catch (error) {
			if (options.allowMissing && hasCode(error, 'ENOENT')) return;
			throw error;
		}
	}
}

export function assertNodePathHasNoSymlinkSync(options: { allowMissing?: boolean; path: string; root: string }): void {
	if (!options.root) return;
	for (const candidate of nodePathSegments(options.root, options.path)) {
		try {
			if (lstatSync(candidate).isSymbolicLink()) throw symlinkError(candidate);
		} catch (error) {
			if (options.allowMissing && hasCode(error, 'ENOENT')) return;
			throw error;
		}
	}
}

export async function readBoundedNodeFile(options: {
	encoding: 'binary' | 'text';
	fs: NodeFsPromises;
	maxBytes: number;
	onDownloadProgress?: (event: { loaded: number; total: number }) => void;
	path: string;
	signal?: AbortSignal;
}): Promise<string | Uint8Array> {
	const file = await options.fs.open(options.path, 'r');
	try {
		throwIfAborted(options.signal);
		const stat = await file.stat();
		const output = Buffer.alloc(Math.min(options.maxBytes, Math.max(0, stat.size)));
		let loaded = 0;
		while (loaded < output.byteLength) {
			throwIfAborted(options.signal);
			const { bytesRead } = await file.read(output, loaded, output.byteLength - loaded, loaded);
			if (bytesRead === 0) break;
			loaded += bytesRead;
			options.onDownloadProgress?.({ loaded, total: stat.size });
		}
		throwIfAborted(options.signal);
		const value = output.subarray(0, loaded);
		return options.encoding === 'text' ? value.toString('utf8') : value;
	} finally {
		await file.close();
	}
}

function throwIfAborted(signal?: AbortSignal): void {
	if (signal?.aborted) throw signal.reason ?? new DOMException('Operation aborted', 'AbortError');
}

function nodePathSegments(root: string, target: string): string[] {
	const relative = path.relative(root, target);
	const segments = relative ? relative.split(path.sep).filter(Boolean) : [];
	const output = [root];
	let current = root;
	for (const segment of segments) {
		current = path.join(current, segment);
		output.push(current);
	}
	return output;
}

function symlinkError(filePath: string): FileSystemError {
	return new FileSystemError(`Symbolic links are not allowed in the filesystem root: ${filePath}`, 'ELOOP');
}

function hasCode(error: unknown, code: string): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
