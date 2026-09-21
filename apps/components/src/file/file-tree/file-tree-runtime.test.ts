import { describe, expect, it, vi } from 'vitest';
import { createFileTreeRuntime } from './file-tree-runtime';
import { createFileTreeStore } from './file-tree-store';
import type { FileTreeFileStat, FileTreeFileSystem } from './file-tree-types';

describe('file tree runtime', () => {
	it('refreshes cached directories without resetting expanded state', async () => {
		let targetEntries = [stat('/Target/before.txt')];
		const readdir = vi.fn(async (path: string) => {
			if (path === '/') return [stat('/Target', 'directory')];
			if (path === '/Target') return targetEntries;
			return [];
		});
		const store = createFileTreeStore({ fileSystem: { readdir } });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await vi.waitFor(() => expect(store.getState().tree.directories.get('/')?.status).toBe('ready'));
		store.getState().actions.expand('/Target');
		await vi.waitFor(() => expect(store.getState().tree.directories.get('/Target')?.status).toBe('ready'));
		targetEntries = [stat('/Target/after.txt')];
		store.getState().actions.requestRefresh(['/Target']);
		await vi.waitFor(() =>
			expect(store.getState().tree.directories.get('/Target')?.entries[0]?.path).toBe('/Target/after.txt'),
		);
		expect(store.getState().tree.expanded.has('/Target')).toBe(true);
		expect(readdir.mock.calls.filter(([path]) => path === '/Target')).toHaveLength(2);
		runtime.dispose();
	});

	it('drains refresh state requested while the runtime is not mounted', async () => {
		let targetEntries = [stat('/Target/before.txt')];
		const readdir = vi.fn(async (path: string) => {
			if (path === '/') return [stat('/Target', 'directory')];
			if (path === '/Target') return targetEntries;
			return [];
		});
		const store = createFileTreeStore({ fileSystem: { readdir } });
		const initialRuntime = createFileTreeRuntime(store);
		initialRuntime.start();
		await vi.waitFor(() => expect(store.getState().tree.directories.get('/')?.status).toBe('ready'));
		store.getState().actions.expand('/Target');
		await vi.waitFor(() => expect(store.getState().tree.directories.get('/Target')?.status).toBe('ready'));
		initialRuntime.dispose();

		targetEntries = [stat('/Target/after.txt')];
		store.getState().actions.requestRefresh(['/Target']);
		expect(store.getState().tree.directories.get('/Target')?.status).toBe('idle');
		expect([...store.getState().tree.pendingRefresh]).toEqual(['/Target']);
		expect(store.getState().tree.expanded.has('/Target')).toBe(true);

		const resumedRuntime = createFileTreeRuntime(store);
		resumedRuntime.start();
		await resumedRuntime.whenIdle();
		expect(store.getState().tree.directories.get('/Target')?.entries[0]?.path).toBe('/Target/after.txt');
		expect(store.getState().tree.pendingRefresh.size).toBe(0);
		expect(store.getState().tree.expanded.has('/Target')).toBe(true);
		resumedRuntime.dispose();
	});

	it('refreshing a parent keeps independent expanded child loads alive', async () => {
		let childSignal: AbortSignal | undefined;
		let resolveChild: (entries: FileTreeFileStat[]) => void = () => undefined;
		const readdir = vi.fn(async (path: string, options?: { signal?: AbortSignal }) => {
			if (path === '/') return [stat('/Target', 'directory')];
			childSignal = options?.signal;
			return new Promise<FileTreeFileStat[]>((resolve) => {
				resolveChild = resolve;
			});
		});
		const store = createFileTreeStore({ fileSystem: { readdir } });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await vi.waitFor(() => expect(store.getState().tree.directories.get('/')?.status).toBe('ready'));
		store.getState().actions.expand('/Target');
		await vi.waitFor(() => expect(childSignal).toBeDefined());
		store.getState().actions.requestRefresh(['/']);
		await vi.waitFor(() => expect(readdir.mock.calls.filter(([path]) => path === '/')).toHaveLength(2));
		expect(childSignal?.aborted).toBe(false);
		resolveChild([stat('/Target/child.txt')]);
		await runtime.whenIdle();
		expect(store.getState().tree.directories.get('/Target')?.entries[0]?.path).toBe('/Target/child.txt');
		expect(store.getState().tree.expanded.has('/Target')).toBe(true);
		runtime.dispose();
	});

	it('deduplicates a path and aborts its load when the directory collapses', async () => {
		let nestedSignal: AbortSignal | undefined;
		const readdir = vi.fn(async (path: string, options?: { signal?: AbortSignal }) => {
			if (path === '/') return [stat('/a', 'directory')];
			nestedSignal = options?.signal;
			return new Promise<FileTreeFileStat[]>((_, reject) => {
				options?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), {
					once: true,
				});
			});
		});
		const store = createFileTreeStore({ fileSystem: { readdir } });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await vi.waitFor(() => expect(store.getState().tree.directories.get('/')?.status).toBe('ready'));
		store.getState().actions.expand('/a');
		store.getState().actions.expand('/a');
		await vi.waitFor(() => expect(readdir.mock.calls.filter(([path]) => path === '/a')).toHaveLength(1));
		store.getState().actions.collapse('/a');
		await runtime.whenIdle();
		expect(nestedSignal?.aborted).toBe(true);
		expect(store.getState().tree.directories.get('/a')?.status).toBe('idle');
		runtime.dispose();
	});

	it('never exceeds configured concurrency across independent directories', async () => {
		let active = 0;
		let peak = 0;
		const pending: Array<() => void> = [];
		const readdir = vi.fn(async (path: string) => {
			if (path === '/') return ['a', 'b', 'c', 'd'].map((name) => stat(`/${name}`, 'directory'));
			active += 1;
			peak = Math.max(peak, active);
			await new Promise<void>((resolve) => pending.push(resolve));
			active -= 1;
			return [];
		});
		const store = createFileTreeStore({ fileSystem: { readdir }, limits: { maxConcurrency: 2 } });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await vi.waitFor(() => expect(store.getState().tree.directories.get('/')?.status).toBe('ready'));
		for (const path of ['/a', '/b', '/c', '/d']) store.getState().actions.expand(path);
		await vi.waitFor(() => expect(active).toBe(2));
		while (pending.length) {
			pending.shift()?.();
			await Promise.resolve();
			await Promise.resolve();
		}
		await runtime.whenIdle();
		expect(peak).toBe(2);
		expect(readdir).toHaveBeenCalledTimes(5);
		runtime.dispose();
	});

	it('rejects oversized directory results before sanitizing or sorting entries', async () => {
		const readName = vi.fn(() => 'unsafe.txt');
		const entry = {} as FileTreeFileStat;
		Object.defineProperty(entry, 'name', { get: readName });
		const store = createFileTreeStore({
			fileSystem: { readdir: async () => Array<FileTreeFileStat>(4).fill(entry) },
			limits: { maxNodes: 3 },
		});
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await runtime.whenIdle();
		expect(readName).not.toHaveBeenCalled();
		expect(store.getState().tree.directories.get('/')).toMatchObject({
			error: 'Directory entry count exceeds the tree node limit: 3',
			errorCode: 'max-nodes',
			status: 'error',
		});
		runtime.dispose();
	});

	it('reveals currentPath one ancestor at a time using authoritative raw paths', async () => {
		const target = '/a?#/b%/report?#%.txt';
		const readdir = vi.fn(async (path: string) => {
			if (path === '/') return [stat('/malicious/a', 'directory', 'a?#')];
			if (path === '/a?#') return [stat('/malicious/b', 'directory', 'b%')];
			if (path === '/a?#/b%') return [stat('/malicious/file', 'file', 'report?#%.txt')];
			return [];
		});
		const store = createFileTreeStore({ currentPath: target, fileSystem: { readdir } });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await runtime.whenIdle();
		expect(readdir.mock.calls.map(([path]) => path)).toEqual(['/', '/a?#', '/a?#/b%']);
		expect([...store.getState().tree.expanded]).toEqual(['/a?#', '/a?#/b%']);
		expect(store.getState().tree.directories.get('/a?#/b%')?.entries[0]?.path).toBe(target);
		expect(store.getState().reveal).toMatchObject({ path: target, status: 'ready' });
		runtime.dispose();
	});

	it('aborts and suppresses a stale source generation even when the adapter resolves late', async () => {
		let resolveOld: (entries: FileTreeFileStat[]) => void = () => undefined;
		let oldSignal: AbortSignal | undefined;
		const oldFileSystem: FileTreeFileSystem = {
			readdir: async (_path, options) => {
				oldSignal = options?.signal;
				return new Promise<FileTreeFileStat[]>((resolve) => {
					resolveOld = resolve;
				});
			},
		};
		const store = createFileTreeStore({ fileSystem: oldFileSystem });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await vi.waitFor(() => expect(oldSignal).toBeDefined());
		store.getState().actions.replaceSource({ fileSystem: { readdir: async () => [] }, rootPath: '/next' });
		await vi.waitFor(() => expect(oldSignal?.aborted).toBe(true));
		resolveOld([stat('/stale.txt')]);
		await runtime.whenIdle();
		expect(store.getState().source.rootPath).toBe('/next');
		expect(store.getState().tree.directories.has('/')).toBe(false);
		runtime.dispose();
	});

	it('keeps failures retryable and commits the later successful result', async () => {
		let attempts = 0;
		const fileSystem: FileTreeFileSystem = {
			readdir: async () => {
				attempts += 1;
				if (attempts === 1) throw new Error('offline');
				return [stat('/ready.txt')];
			},
		};
		const store = createFileTreeStore({ fileSystem });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await runtime.whenIdle();
		expect(store.getState().tree.directories.get('/')).toMatchObject({ error: 'offline', status: 'error' });
		store.getState().actions.retry('/');
		await runtime.whenIdle();
		expect(store.getState().tree.directories.get('/')).toMatchObject({ status: 'ready' });
		expect(store.getState().tree.directories.get('/')?.entries[0]?.path).toBe('/ready.txt');
		expect(store.getState().reveal.status).toBe('ready');
		runtime.dispose();
	});

	it('aborts active filesystem work when the runtime sidecar is disposed', async () => {
		let signal: AbortSignal | undefined;
		const fileSystem: FileTreeFileSystem = {
			readdir: async (_path, options) => {
				signal = options?.signal;
				return new Promise<FileTreeFileStat[]>((_, reject) => {
					options?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), {
						once: true,
					});
				});
			},
		};
		const runtime = createFileTreeRuntime(createFileTreeStore({ fileSystem }));
		runtime.start();
		await vi.waitFor(() => expect(signal).toBeDefined());
		runtime.dispose();
		expect(signal?.aborted).toBe(true);
		await runtime.whenIdle();
	});

	it('fails reveal before loading beyond maxDepth', async () => {
		const readdir = vi.fn(async (path: string) => {
			if (path === '/') return [stat('/a', 'directory')];
			return [stat('/a/b', 'directory')];
		});
		const store = createFileTreeStore({ currentPath: '/a/b/file', fileSystem: { readdir }, limits: { maxDepth: 2 } });
		const runtime = createFileTreeRuntime(store);
		runtime.start();
		await runtime.whenIdle();
		expect(readdir).toHaveBeenCalledTimes(1);
		expect(store.getState().reveal.status).toBe('error');
		runtime.dispose();
	});
});

function stat(
	path: string,
	kind: 'directory' | 'file' = 'file',
	name = path.slice(path.lastIndexOf('/') + 1),
): FileTreeFileStat {
	return {
		directory: path.slice(0, path.lastIndexOf('/')) || '/',
		kind,
		meta: {},
		mtime: 1,
		name,
		path,
		size: kind === 'file' ? 1 : 0,
	};
}
