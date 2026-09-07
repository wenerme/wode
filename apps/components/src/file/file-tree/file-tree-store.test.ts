import { describe, expect, it, vi } from 'vite-plus/test';
import { FileTreeEventType } from './file-tree-events';
import { createFileTreeStore } from './file-tree-store';
import type { FileTreeFileStat, FileTreeFileSystem } from './file-tree-types';

const fileSystem: FileTreeFileSystem = { readdir: async () => [] };

describe('file tree store', () => {
	it('keeps mutations in the actions namespace and emits typed Module:Action requests', async () => {
		const store = createFileTreeStore({ fileSystem, rootPath: '/workspace' });
		expect(store.getState().actions).toBeDefined();
		expect('expand' in store.getState()).toBe(false);
		const listener = vi.fn();
		store.getState().events.on(FileTreeEventType.LoadRequested, listener);
		store.getState().actions.requestLoad('/workspace', 'root');
		await vi.waitFor(() =>
			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'FileTree:LoadRequested',
					data: expect.objectContaining({ path: '/workspace', reason: 'root' }),
				}),
			),
		);
	});

	it('suppresses stale requests after source generations change', () => {
		const store = createFileTreeStore({ fileSystem });
		const generation = store.getState().source.generation;
		store.getState().actions.requestLoad('/');
		const requestId = store.getState().actions.beginLoad('/', generation) as number;
		const replacement = { readdir: async () => [] };
		expect(store.getState().actions.replaceSource({ fileSystem: replacement, rootPath: '/next' })).toBe(true);
		expect(store.getState().actions.completeLoad('/', generation, requestId, [stat('/stale.txt')])).toBe(false);
		expect(store.getState().source.rootPath).toBe('/next');
		expect(store.getState().tree.directories.has('/')).toBe(false);
	});

	it('evicts collapsed least-recently-used directories while retaining expanded cache', () => {
		const store = createFileTreeStore({ fileSystem, limits: { maxCachedDirectories: 2 } });
		complete(store, '/', [stat('/a', 'directory'), stat('/b', 'directory')]);
		store.getState().actions.expand('/a');
		complete(store, '/a', []);
		store.getState().actions.collapse('/a');
		store.getState().actions.expand('/b');
		complete(store, '/b', []);
		expect(store.getState().tree.directories.has('/a')).toBe(false);
		expect(store.getState().tree.directories.get('/b')?.status).toBe('ready');
		expect(readyDirectoryCount(store)).toBe(2);
	});

	it('protects selected ancestry and fails retryably instead of exceeding cache bounds', () => {
		const store = createFileTreeStore({ fileSystem, limits: { maxCachedDirectories: 2 } });
		complete(store, '/', [stat('/a', 'directory'), stat('/b', 'directory')]);
		store.getState().actions.expand('/a');
		complete(store, '/a', [stat('/a/file.txt')]);
		store.getState().actions.collapse('/a');
		store.getState().actions.syncSelectedPath('/a/file.txt');
		store.getState().actions.expand('/b');
		complete(store, '/b', []);
		expect(store.getState().tree.directories.get('/a')?.status).toBe('ready');
		expect(store.getState().tree.directories.get('/b')).toMatchObject({
			errorCode: 'max-cached-directories',
			status: 'error',
		});
		expect(readyDirectoryCount(store)).toBe(2);
	});

	it('enforces the aggregate node bound without partially exposing a listing', () => {
		const store = createFileTreeStore({ fileSystem, limits: { maxNodes: 3 } });
		complete(store, '/', [stat('/a', 'directory'), stat('/root.txt')]);
		store.getState().actions.expand('/a');
		complete(store, '/a', [stat('/a/one.txt'), stat('/a/two.txt')]);
		expect(store.getState().tree.directories.get('/a')).toMatchObject({
			entries: [],
			errorCode: 'max-nodes',
			status: 'error',
		});
		expect(cachedNodeCount(store)).toBe(2);
	});

	it('collapsing removes descendant expansion state and emits an abort boundary', async () => {
		const store = createFileTreeStore({ fileSystem });
		const listener = vi.fn();
		store.getState().events.on(FileTreeEventType.AbortRequested, listener);
		store.getState().actions.expand('/a');
		store.getState().actions.expand('/a/b');
		store.getState().actions.collapse('/a');
		expect([...store.getState().tree.expanded]).toEqual([]);
		await vi.waitFor(() =>
			expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ path: '/a' }) })),
		);
	});

	it('prunes only removed subtrees while preparing cached parent refreshes', () => {
		const store = createFileTreeStore({ fileSystem });
		complete(store, '/', [stat('/Source', 'directory'), stat('/Target', 'directory')]);
		store.getState().actions.expand('/Source');
		complete(store, '/Source', [stat('/Source/nested', 'directory')]);
		store.getState().actions.expand('/Source/nested');
		complete(store, '/Source/nested', []);
		store.getState().actions.expand('/Target');
		complete(store, '/Target', []);
		const generation = store.getState().source.generation;
		expect(store.getState().actions.beginRefresh(['/', '/Target'], ['/Source'], generation)).toEqual({
			paths: ['/', '/Target'],
			removedPaths: ['/Source'],
		});
		expect(store.getState().tree.directories.has('/Source')).toBe(false);
		expect(store.getState().tree.directories.has('/Source/nested')).toBe(false);
		expect([...store.getState().tree.expanded]).toEqual(['/Target']);
		expect(store.getState().tree.directories.get('/')).toMatchObject({ status: 'idle' });
		expect(store.getState().tree.directories.get('/Target')).toMatchObject({ status: 'idle' });
		expect([...store.getState().tree.pendingRefresh]).toEqual(['/', '/Target']);
		expect([...store.getState().tree.pendingRemoval]).toEqual(['/Source']);
	});

	it('bounds accumulated removal intent with a root refresh fallback', () => {
		const store = createFileTreeStore({ fileSystem, limits: { maxNodes: 3 } });
		complete(store, '/', [stat('/Cached', 'directory')]);
		store.getState().actions.expand('/Cached');
		complete(store, '/Cached', []);
		for (const path of ['/removed-1', '/removed-2', '/removed-3']) {
			store.getState().actions.requestRefresh(['/'], { removedPaths: [path] });
		}
		expect(store.getState().tree.pendingRemoval.size).toBe(3);
		store.getState().actions.requestRefresh(['/'], { removedPaths: ['/removed-4'] });
		expect([...store.getState().tree.pendingRemoval]).toEqual([]);
		expect([...store.getState().tree.pendingRefresh]).toEqual(['/']);
		expect([...store.getState().tree.directories.keys()]).toEqual(['/']);
		expect([...store.getState().tree.expanded]).toEqual([]);
		expect(store.getState().tree.directories.get('/')).toMatchObject({ status: 'idle' });
	});
});

function complete(store: ReturnType<typeof createFileTreeStore>, path: string, entries: FileTreeFileStat[]) {
	const generation = store.getState().source.generation;
	store.getState().actions.requestLoad(path);
	const requestId = store.getState().actions.beginLoad(path, generation);
	expect(requestId).toBeTypeOf('number');
	store.getState().actions.completeLoad(path, generation, requestId as number, entries);
}

function stat(path: string, kind: 'directory' | 'file' = 'file'): FileTreeFileStat {
	const separator = path.lastIndexOf('/');
	return {
		directory: path.slice(0, separator) || '/',
		kind,
		meta: {},
		mtime: 1,
		name: path.slice(separator + 1),
		path,
		size: kind === 'file' ? 1 : 0,
	};
}

function readyDirectoryCount(store: ReturnType<typeof createFileTreeStore>) {
	return [...store.getState().tree.directories.values()].filter((directory) => directory.status === 'ready').length;
}

function cachedNodeCount(store: ReturnType<typeof createFileTreeStore>) {
	return [...store.getState().tree.directories.values()].reduce(
		(count, directory) => count + (directory.status === 'ready' ? directory.entries.length : 0),
		0,
	);
}
