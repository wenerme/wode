import { describe, expect, it } from 'vite-plus/test';
import {
	buildFileTreeData,
	flattenFileTreeData,
	normalizeFileTreeLimits,
	sanitizeFileTreeEntries,
} from './file-tree-model';
import { createFileTreeStore } from './file-tree-store';
import type { FileTreeFileStat, FileTreeRenderNode } from './file-tree-types';

const fileSystem = { readdir: async () => [] };

describe('file tree model', () => {
	it('rebuilds authoritative direct-child paths and preserves raw URL delimiters', () => {
		const entries = sanitizeFileTreeEntries(
			[stat('/outside/wrong', 'report?#%.txt', 'file'), stat('/outside/wrong', 'folder#1', 'directory')],
			'/workspace?raw',
			'/workspace?raw',
		);
		expect(entries).toEqual([
			expect.objectContaining({ directory: '/workspace?raw', path: '/workspace?raw/folder#1' }),
			expect.objectContaining({ directory: '/workspace?raw', path: '/workspace?raw/report?#%.txt' }),
		]);
	});

	it('rejects unsafe, duplicate, and malformed children before filtering files', () => {
		expect(() => sanitizeFileTreeEntries([stat('/wrong', '../escape')], '/workspace', '/workspace')).toThrow(
			'invalid direct child',
		);
		expect(() => sanitizeFileTreeEntries([stat('/a', 'same'), stat('/b', 'same')], '/', '/')).toThrow(
			'duplicate direct child',
		);
		expect(() =>
			sanitizeFileTreeEntries([stat('/a', 'same', 'directory'), stat('/b', 'same', 'file')], '/', '/', true),
		).toThrow('duplicate direct child');
	});

	it('filters files in directories-only mode without trusting adapter paths', () => {
		const entries = sanitizeFileTreeEntries(
			[stat('/wrong/file', 'file.txt'), stat('/wrong/folder', 'folder', 'directory')],
			'/root',
			'/root',
			true,
		);
		expect(entries).toEqual([expect.objectContaining({ kind: 'directory', path: '/root/folder' })]);
	});

	it('clamps public limits to hard runtime bounds', () => {
		expect(
			normalizeFileTreeLimits({
				maxCachedDirectories: 999,
				maxConcurrency: 0,
				maxDepth: 1000,
				maxNodes: Number.POSITIVE_INFINITY,
			}),
		).toEqual({ maxCachedDirectories: 256, maxConcurrency: 1, maxDepth: 64, maxNodes: 10_000 });
	});

	it('builds cached expanded data and flattens it iteratively', () => {
		const store = createFileTreeStore({ fileSystem });
		complete(store, '/', [stat('/a', 'a', 'directory'), stat('/root.txt', 'root.txt')]);
		store.getState().actions.expand('/a');
		complete(store, '/a', [stat('/a/nested.txt', 'nested.txt')]);
		const data = buildFileTreeData(store.getState());
		expect(flattenFileTreeData(data).map((node) => node.path)).toEqual(['/a', '/a/nested.txt', '/root.txt']);

		let nested: FileTreeRenderNode = node('/0', 0);
		const roots = [nested];
		for (let depth = 1; depth <= 2_000; depth += 1) {
			const child = node(`/${depth}`, depth);
			nested.children = [child];
			nested = child;
		}
		expect(flattenFileTreeData(roots)).toHaveLength(2_001);
	});
});

function complete(store: ReturnType<typeof createFileTreeStore>, path: string, entries: FileTreeFileStat[]) {
	const state = store.getState();
	state.actions.requestLoad(path);
	const requestId = store.getState().actions.beginLoad(path, state.source.generation);
	expect(requestId).toBeTypeOf('number');
	store.getState().actions.completeLoad(path, state.source.generation, requestId as number, entries);
}

function stat(path: string, name = 'file.txt', kind: 'directory' | 'file' = 'file'): FileTreeFileStat {
	return { directory: '/untrusted', kind, meta: {}, mtime: 1, name, path, size: kind === 'file' ? 1 : 0 };
}

function node(path: string, depth: number): FileTreeRenderNode {
	const entry = stat(path, path, 'directory');
	return {
		children: [],
		depth,
		entry,
		id: path,
		isCurrent: false,
		kind: 'directory',
		name: path,
		path,
		status: 'ready',
	};
}
