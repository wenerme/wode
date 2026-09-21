import { describe, expect, it, vi } from 'vitest';
import { createFileManagerStore } from './file-manager-store';
import type { FileManagerFileSystem } from './file-manager-types';
import { fileManagerOperationHardItemLimit, fileManagerUploadHardFileLimit } from './file-manager-types';

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

	it('binds open requests to the current listing and filesystem scope', async () => {
		const store = createFileManagerStore({ fileSystem: fs, rootPath: '/workspace' });
		const listener = vi.fn();
		store.getState().events.on('request', listener);
		const entry = {
			directory: '/workspace',
			kind: 'file' as const,
			meta: {},
			mtime: 1,
			name: 'readme.md',
			path: '/workspace/readme.md',
			size: 4,
		};
		store.getState().actions.open(entry);
		await vi.waitFor(() => {
			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({
					data: {
						type: 'open',
						directory: '/workspace',
						entry,
						fileSystem: fs,
						listingRequestId: 0,
						rootPath: '/workspace',
					},
				}),
			);
		});
	});

	it('records structured terminal feedback and emits cancellation through the sidecar seam', async () => {
		const store = createFileManagerStore({ fileSystem: fs });
		const listener = vi.fn();
		store.getState().events.on('request', listener);
		const operation = { type: 'upload' as const, directory: '/', files: [new File(['a'], 'a.txt')] };
		store.getState().actions.requestOperation(operation);
		const requestId = store.getState().operation.activeRequestId as number;
		store.getState().actions.cancelOperation();
		await vi.waitFor(() => {
			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({ data: { type: 'cancel-operation', fileSystem: fs, requestId } }),
			);
		});
		const result = { completed: [], failed: [{ path: '/a.txt', error: new Error('offline') }] };
		store.getState().actions.finishOperation(requestId, operation, 'failed', { error: new Error('partial'), result });
		expect(store.getState().operation.feedback).toMatchObject({ operation, outcome: 'failed', result });
		store.getState().actions.dismissOperationFeedback();
		expect(store.getState().operation).toMatchObject({ status: 'idle', feedback: undefined });
	});

	it('does not let an old backend terminal settle a newer same-type operation', () => {
		const nextFs = {} as FileManagerFileSystem;
		const store = createFileManagerStore({ fileSystem: fs });
		const first = { type: 'upload' as const, directory: '/', files: [new File(['a'], 'a.txt')] };
		store.getState().actions.requestOperation(first);
		const firstId = store.getState().operation.activeRequestId as number;
		store.getState().actions.replaceFileSystem(nextFs, '/');
		const second = { type: 'upload' as const, directory: '/', files: [new File(['b'], 'b.txt')] };
		store.getState().actions.requestOperation(second);
		const secondId = store.getState().operation.activeRequestId as number;
		expect(secondId).toBeGreaterThan(firstId);

		store.getState().actions.finishOperation(firstId, first, 'cancelled');
		expect(store.getState().operation).toMatchObject({
			activeRequestId: secondId,
			kind: 'upload',
			status: 'running',
		});
		store.getState().actions.finishOperation(secondId, second, 'succeeded', {
			result: { completed: ['/b.txt'], failed: [] },
		});
		expect(store.getState().operation.feedback).toMatchObject({ operation: second, outcome: 'succeeded' });
	});

	it('bounds upload candidates before storing or emitting the operation', () => {
		const store = createFileManagerStore({ fileSystem: fs });
		const file = new File([], 'same.txt');
		const files = Array<File>(fileManagerUploadHardFileLimit + 10).fill(file);
		store.getState().actions.requestOperation({ type: 'upload', directory: '/', files });
		const active = store.getState().operation.active;
		expect(active?.type).toBe('upload');
		if (active?.type !== 'upload') throw new Error('expected upload operation');
		expect(active.files).toHaveLength(fileManagerUploadHardFileLimit - 1);
		expect(active.rejected).toEqual([{ name: '其余 11 个项目', reason: 'too-many' }]);
		expect(files).toHaveLength(fileManagerUploadHardFileLimit + 10);
	});

	it('rejects oversized path batches before placing them in state', () => {
		const store = createFileManagerStore({ fileSystem: fs });
		const paths = Array<string>(fileManagerOperationHardItemLimit + 1).fill('/same.txt');
		store.getState().actions.requestOperation({ type: 'delete', paths });
		expect(store.getState().operation).toMatchObject({
			notice: `单次操作最多处理 ${fileManagerOperationHardItemLimit} 个项目`,
			status: 'idle',
		});
		expect(store.getState().operation.active).toBeUndefined();
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
		const operation = { type: 'save-text' as const, path: '/draft.txt', content: 'unsaved' };
		actions.setPreviewDraft({ content: 'unsaved', path: '/draft.txt' });
		actions.requestOperation(operation);
		let requestId = store.getState().operation.activeRequestId as number;
		expect(store.getState().preview.pendingSavePath).toBe('/draft.txt');

		actions.finishOperation(requestId, operation, 'cancelled');
		expect(store.getState().preview.draft).toEqual({ content: 'unsaved', path: '/draft.txt' });
		expect(store.getState().preview.saveError).toEqual({ message: '保存已取消', path: '/draft.txt' });

		actions.requestOperation(operation);
		requestId = store.getState().operation.activeRequestId as number;
		actions.finishOperation(requestId, operation, 'failed', { error: new Error('offline') });
		expect(store.getState().preview.draft?.content).toBe('unsaved');
		expect(store.getState().preview.saveError).toEqual({ message: 'offline', path: '/draft.txt' });

		actions.requestOperation(operation);
		requestId = store.getState().operation.activeRequestId as number;
		actions.finishOperation(requestId, operation, 'succeeded');
		expect(store.getState().preview).toEqual({});
	});
});
