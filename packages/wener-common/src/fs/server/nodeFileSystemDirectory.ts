import type { Stats } from 'node:fs';
import path from 'node:path';
import { FileSystemError } from '../FileSystemError';
import type { IFileStat, ReaddirOptions } from '../IFileSystem';
import { assertReaddirEntryLimit } from '../readdirLimit';
import { rejectUnsupportedFileSystemLimit } from '../resourceLimits';

type NodeFsPromises = typeof import('node:fs/promises');

export async function readNodeDirectory(options: {
	dir: string;
	fs: NodeFsPromises;
	maxEntries?: number;
	options: ReaddirOptions;
	readdir(dir: string, options: ReaddirOptions): Promise<IFileStat[]>;
	stripRoot(path: string): string;
	throwIfAborted(): void;
}): Promise<IFileStat[]> {
	const { depth = 1, glob, hidden = true, kind, recursive } = options.options;
	if (options.maxEntries !== undefined) {
		if (glob || recursive || depth > 1 || kind || !hidden) {
			rejectUnsupportedFileSystemLimit('readdir', 'maxEntries', options.maxEntries);
		}
		return readBoundedNodeDirectory(options);
	}

	const entries = await options.fs.readdir(options.dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.isSymbolicLink()) throw symlinkError(path.join(options.dir, entry.name));
	}
	let results = await Promise.all(
		entries
			.filter((entry) => hidden || !entry.name.startsWith('.'))
			.filter((entry) => !kind || (kind === 'directory' ? entry.isDirectory() : entry.isFile()))
			.map(async (entry) => {
				options.throwIfAborted();
				const entryPath = path.join(options.dir, entry.name);
				return toNodeFileStat(
					entryPath,
					entry.name,
					entry.isDirectory(),
					await options.fs.stat(entryPath),
					options.stripRoot,
				);
			}),
	);

	if (recursive || depth > 1) {
		for (const subdir of results.filter((entry) => entry.kind === 'directory')) {
			options.throwIfAborted();
			const nextDepth = recursive ? Infinity : depth - 1;
			if (nextDepth > 0) {
				results = [...results, ...(await options.readdir(subdir.path, { ...options.options, depth: nextDepth }))];
			}
		}
	}
	if (glob) {
		const { matcher } = await import('micromatch');
		const match = matcher(glob);
		results = results.filter((entry) => match(entry.path));
	}
	return results;
}

async function readBoundedNodeDirectory(options: {
	dir: string;
	fs: NodeFsPromises;
	maxEntries?: number;
	stripRoot(path: string): string;
	throwIfAborted(): void;
}): Promise<IFileStat[]> {
	const entries: IFileStat[] = [];
	const directory = await options.fs.opendir(options.dir);
	try {
		for await (const entry of directory) {
			options.throwIfAborted();
			assertReaddirEntryLimit(entries.length + 1, options.maxEntries, options.dir);
			const entryPath = path.join(options.dir, entry.name);
			if (entry.isSymbolicLink()) throw symlinkError(entryPath);
			const stat = await options.fs.stat(entryPath);
			entries.push(toNodeFileStat(entryPath, entry.name, entry.isDirectory(), stat, options.stripRoot));
		}
	} finally {
		await directory.close().catch(() => undefined);
	}
	return entries;
}

export function toNodeFileStat(
	fullPath: string,
	name: string,
	directoryEntry: boolean,
	stat: Stats,
	stripRoot: (path: string) => string,
): IFileStat {
	return {
		directory: stripRoot(path.dirname(fullPath)) || '/',
		path: stripRoot(fullPath),
		name,
		kind: directoryEntry ? 'directory' : 'file',
		mtime: stat.mtimeMs,
		size: stat.size,
		meta: {},
	};
}

function symlinkError(filePath: string): FileSystemError {
	return new FileSystemError(`Symbolic links are not allowed: ${filePath}`, 'ELOOP');
}
