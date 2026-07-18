import type { FsStat as JustBashFsStat } from 'just-bash';
import { JustBashCopyLimitError, type JustBashCopyLimits, JustBashFileAllocationLimitError } from './adapterLimits';
import { childVirtualPath } from './paths';
import type { JustBashDirent } from './virtualFileSystem';

export type JustBashCopyPlanEntry =
	| { destination: string; directory: true }
	| { destination: string; directory: false; content: Uint8Array };

type CopyTraversalEntry = { source: string; destination: string; depth: number };

type CreateJustBashCopyPlanOptions = {
	source: string;
	destination: string;
	limits: Readonly<JustBashCopyLimits>;
	maxReadBytes: number;
	stat(path: string): Promise<JustBashFsStat>;
	readdir(path: string, maxEntries: number): Promise<JustBashDirent[]>;
	readFile(path: string, remainingBytes: number): Promise<Uint8Array>;
	throwIfAborted(): void;
};

export async function createJustBashCopyPlan({
	source,
	destination,
	limits,
	maxReadBytes,
	stat,
	readdir,
	readFile,
	throwIfAborted,
}: CreateJustBashCopyPlanOptions): Promise<JustBashCopyPlanEntry[]> {
	const plan: JustBashCopyPlanEntry[] = [];
	const pending: CopyTraversalEntry[] = [{ source, destination, depth: 0 }];
	let files = 0;
	let directories = 0;
	let totalBytes = 0;

	while (pending.length > 0) {
		throwIfAborted();
		const current = pending.pop()!;
		assertMaximum('maxDepth', current.depth, limits);
		assertMaximum('maxEntries', plan.length + 1, limits);

		const sourceStat = await stat(current.source);
		throwIfAborted();
		if (sourceStat.isDirectory) {
			assertMaximum('maxDirectories', ++directories, limits);
			plan.push({ destination: current.destination, directory: true });
			let entries: JustBashDirent[];
			try {
				entries = await readdir(current.source, limits.maxDirectoryEntries);
			} catch (error) {
				if (isEntryLimitError(error)) {
					throw new JustBashCopyLimitError('maxDirectoryEntries', limits.maxDirectoryEntries);
				}
				throw error;
			}
			throwIfAborted();
			assertMaximum('maxEntries', plan.length + pending.length + entries.length, limits);
			for (let index = entries.length - 1; index >= 0; index--) {
				const entry = entries[index]!;
				pending.push({
					source: childVirtualPath(current.source, entry.name),
					destination: childVirtualPath(current.destination, entry.name),
					depth: current.depth + 1,
				});
			}
			continue;
		}
		if (!sourceStat.isFile) throw new Error(`Unsupported source type for copy: ${current.source}`);

		assertMaximum('maxFiles', ++files, limits);
		assertFileSize(sourceStat.size, maxReadBytes, limits.maxBytes - totalBytes, limits.maxBytes);
		const content = await readFile(current.source, limits.maxBytes - totalBytes);
		assertFileSize(content.byteLength, maxReadBytes, limits.maxBytes - totalBytes, limits.maxBytes);
		totalBytes += content.byteLength;
		plan.push({ destination: current.destination, directory: false, content });
	}
	return plan;
}

function assertMaximum(
	limit: 'maxEntries' | 'maxFiles' | 'maxDirectories' | 'maxDepth',
	value: number,
	limits: JustBashCopyLimits,
): void {
	if (value > limits[limit]) throw new JustBashCopyLimitError(limit, limits[limit]);
}

function assertFileSize(size: number, maxReadBytes: number, remainingBytes: number, maxCopyBytes: number): void {
	if (!Number.isSafeInteger(size) || size < 0 || size > maxReadBytes) {
		throw new JustBashFileAllocationLimitError('cp', maxReadBytes);
	}
	if (size > remainingBytes) throw new JustBashCopyLimitError('maxBytes', maxCopyBytes);
}

function isEntryLimitError(error: unknown): boolean {
	return (
		typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'EOVERFLOW'
	);
}
