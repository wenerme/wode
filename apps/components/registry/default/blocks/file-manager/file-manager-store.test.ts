import { describe, expect, it, vi } from 'vite-plus/test';
import { createFileManagerStore } from './file-manager-store';
import type { FileManagerFileSystem } from './file-manager-types';

const fs = {} as FileManagerFileSystem;

describe('file manager store', () => {
	it('keeps actions namespaced and rejects navigation outside the scoped root', () => {
		const store = createFileManagerStore({ fileSystem: fs, rootPath: '/workspace', initialPath: '/outside' });
		const state = store.getState();
		expect(state.navigation.path).toBe('/workspace');
		expect(state.actions).toBeDefined();
		expect('refresh' in state).toBe(false);

		state.actions.requestNavigate('/other');
		expect(store.getState().listing.status).toBe('error');
		expect(store.getState().listing.error).toContain('超出根目录');
	});

	it('suppresses stale listing commits and preserves the last good entries on failure', () => {
		const store = createFileManagerStore({ fileSystem: fs });
		const first = store.getState().actions.beginListing('/first');
		const second = store.getState().actions.beginListing('/second');
		expect(store.getState().actions.completeListing(first, '/first', [], { type: 'push' })).toBe(false);
		const entry = {
			name: 'readme.md',
			path: '/second/readme.md',
			directory: '/second',
			kind: 'file' as const,
			size: 4,
			mtime: 1,
			meta: {},
		};
		expect(store.getState().actions.completeListing(second, '/second', [entry], { type: 'push' })).toBe(true);
		const refresh = store.getState().actions.beginListing('/second');
		expect(store.getState().actions.failListing(refresh, 'offline')).toBe(true);
		expect(store.getState().listing.entries).toEqual([entry]);
		expect(store.getState().listing.status).toBe('error');
	});

	it('supports range, toggle, and select-all semantics', () => {
		const store = createFileManagerStore({ fileSystem: fs });
		const visiblePaths = ['/a', '/b', '/c', '/d'];
		store.getState().actions.select('/b', { visiblePaths });
		store.getState().actions.select('/d', { range: true, visiblePaths });
		expect(store.getState().selection.paths).toEqual(['/b', '/c', '/d']);
		store.getState().actions.select('/c', { toggle: true, visiblePaths });
		expect(store.getState().selection.paths).toEqual(['/b', '/d']);
		store.getState().actions.selectAll(visiblePaths);
		expect(store.getState().selection.paths).toEqual(visiblePaths);
	});

	it('emits operation requests without executing filesystem effects in the store', async () => {
		const store = createFileManagerStore({ fileSystem: fs });
		const listener = vi.fn();
		store.getState().events.on('request', listener);
		const operation = { type: 'create-file' as const, directory: '/', name: 'new.txt' };
		store.getState().actions.requestOperation(operation);
		await vi.waitFor(() => {
			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ type: 'operation', operation, fileSystem: fs }),
				}),
			);
		});
	});

	it('emits an empty selection when navigation clears selected entries', async () => {
		const store = createFileManagerStore({ fileSystem: fs });
		const listener = vi.fn();
		store.getState().events.on('event', listener);
		store.getState().actions.select('/selected.txt');
		const requestId = store.getState().actions.beginListing('/next');
		store.getState().actions.completeListing(requestId, '/next', [], { type: 'push' });
		await vi.waitFor(() => {
			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({ data: { type: 'selection-changed', paths: [] } }),
			);
		});
	});

	it('keeps preview drafts through failed or cancelled saves and clears them only after success', () => {
		const store = createFileManagerStore({ fileSystem: fs });
		const actions = store.getState().actions;
		actions.setPreviewDraft({ content: 'unsaved', path: '/draft.txt' });
		actions.requestOperation({ type: 'save-text', path: '/draft.txt', content: 'unsaved' });
		expect(store.getState().preview.pendingSavePath).toBe('/draft.txt');

		actions.finishOperation(undefined, 'cancelled');
		expect(store.getState().preview.draft).toEqual({ content: 'unsaved', path: '/draft.txt' });
		expect(store.getState().preview.saveError).toEqual({ message: '保存已取消', path: '/draft.txt' });

		actions.requestOperation({ type: 'save-text', path: '/draft.txt', content: 'unsaved' });
		actions.finishOperation('offline', 'failed');
		expect(store.getState().preview.draft?.content).toBe('unsaved');
		expect(store.getState().preview.saveError).toEqual({ message: 'offline', path: '/draft.txt' });

		actions.requestOperation({ type: 'save-text', path: '/draft.txt', content: 'unsaved' });
		actions.finishOperation(undefined, 'succeeded');
		expect(store.getState().preview).toEqual({});
	});
});
