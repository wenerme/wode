import { performance } from 'node:perf_hooks';
import { expect } from 'vite-plus/test';
import type { IFileSystem } from '../IFileSystem';

export type RunFileSystemBenchmarkOptions = {
	root?: string;
	smallFileCount?: number;
	largeFileCount?: number;
	largeFileSize?: number;
	concurrency?: number;
	log?: (message: string, metrics: RunFileSystemBenchmarkResult) => void;
};

export type RunFileSystemBenchmarkResult = {
	root: string;
	smallFileCount: number;
	largeFileCount: number;
	largeFileSize: number;
	concurrency: number;
	durationMs: number;
	ops: number;
	opsPerSecond: number;
	bytesWritten: number;
	bytesRead: number;
	writeSmallMs: number;
	writeLargeMs: number;
	statMs: number;
	readMs: number;
	readdirMs: number;
	copyRenameRemoveMs: number;
};

export async function runFileSystemBenchmark(
	fs: IFileSystem,
	options: RunFileSystemBenchmarkOptions = {},
): Promise<RunFileSystemBenchmarkResult> {
	const {
		root = `/bench-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
		smallFileCount = 50,
		largeFileCount = 8,
		largeFileSize = 16 * 1024,
		concurrency = 8,
		log = defaultBenchmarkLog,
	} = options;
	const smallContent = 'small benchmark payload';
	const largeContent = 'x'.repeat(largeFileSize);
	const smallPaths = Array.from({ length: smallFileCount }, (_, i) => `${root}/small/file-${i}.txt`);
	const largePaths = Array.from({ length: largeFileCount }, (_, i) => `${root}/large/file-${i}.bin`);
	let ops = 0;
	let bytesWritten = 0;
	let bytesRead = 0;
	const startedAt = performance.now();

	await fs.mkdir(`${root}/small`, { recursive: true });
	await fs.mkdir(`${root}/large`, { recursive: true });
	ops += 2;

	const writeSmallMs = await measure(async () => {
		await runLimited(smallPaths, concurrency, async (path, index) => {
			const content = `${smallContent}:${index}`;
			await fs.writeFile(path, content);
			bytesWritten += Buffer.byteLength(content);
			ops += 1;
		});
	});

	const writeLargeMs = await measure(async () => {
		await runLimited(largePaths, concurrency, async (path, index) => {
			const content = `${largeContent}:${index}`;
			await fs.writeFile(path, content);
			bytesWritten += Buffer.byteLength(content);
			ops += 1;
		});
	});

	const statMs = await measure(async () => {
		await runLimited([...smallPaths, ...largePaths], concurrency, async (path) => {
			const stat = await fs.stat(path);
			expect(stat.kind).toBe('file');
			ops += 1;
		});
	});

	const readMs = await measure(async () => {
		await runLimited([...smallPaths, ...largePaths], concurrency, async (path) => {
			const content = await fs.readFile(path, { encoding: 'text' });
			expect(content.length).toBeGreaterThan(0);
			bytesRead += Buffer.byteLength(content);
			ops += 1;
		});
	});

	let smallEntries = 0;
	let largeEntries = 0;
	const readdirMs = await measure(async () => {
		smallEntries = (await fs.readdir(`${root}/small`)).length;
		largeEntries = (await fs.readdir(`${root}/large`)).length;
		ops += 2;
	});
	expect(smallEntries).toBe(smallFileCount);
	expect(largeEntries).toBe(largeFileCount);

	const copyRenameRemoveMs = await measure(async () => {
		await fs.copy(smallPaths[0]!, `${root}/copy.txt`);
		await fs.rename(`${root}/copy.txt`, `${root}/renamed.txt`);
		await fs.rm(`${root}/renamed.txt`);
		ops += 3;
	});

	const durationMs = performance.now() - startedAt;
	const result: RunFileSystemBenchmarkResult = {
		root,
		smallFileCount,
		largeFileCount,
		largeFileSize,
		concurrency,
		durationMs,
		ops,
		opsPerSecond: ops / (durationMs / 1000),
		bytesWritten,
		bytesRead,
		writeSmallMs,
		writeLargeMs,
		statMs,
		readMs,
		readdirMs,
		copyRenameRemoveMs,
	};

	log('filesystem benchmark', result);
	return result;
}

async function measure(fn: () => Promise<void>) {
	const startedAt = performance.now();
	await fn();
	return performance.now() - startedAt;
}

async function runLimited<T>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<void>) {
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, async () => {
			while (next < items.length) {
				const index = next++;
				await worker(items[index]!, index);
			}
		}),
	);
}

function defaultBenchmarkLog(message: string, metrics: RunFileSystemBenchmarkResult) {
	console.info(message, {
		root: metrics.root,
		durationMs: Number(metrics.durationMs.toFixed(1)),
		ops: metrics.ops,
		opsPerSecond: Number(metrics.opsPerSecond.toFixed(1)),
		bytesWritten: metrics.bytesWritten,
		bytesRead: metrics.bytesRead,
		writeSmallMs: Number(metrics.writeSmallMs.toFixed(1)),
		writeLargeMs: Number(metrics.writeLargeMs.toFixed(1)),
		statMs: Number(metrics.statMs.toFixed(1)),
		readMs: Number(metrics.readMs.toFixed(1)),
		readdirMs: Number(metrics.readdirMs.toFixed(1)),
		copyRenameRemoveMs: Number(metrics.copyRenameRemoveMs.toFixed(1)),
	});
}
