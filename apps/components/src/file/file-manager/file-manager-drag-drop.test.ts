import { describe, expect, it } from 'vitest';
import {
	evaluateFileManagerDropTarget,
	extractFileManagerExternalDrop,
	fileManagerDragDataType,
	hasBoundedDataTransferType,
	resolveFileManagerDropMode,
} from './file-manager-drag-drop';
import {
	collectFileManagerUploadFiles,
	createFileManagerRetryOperation,
	formatFileManagerOperationError,
	getFileManagerOperationRefreshPlan,
} from './file-manager-operation-utils';
import { fileManagerUploadHardFileLimit } from './file-manager-types';

describe('file manager drag and drop helpers', () => {
	it('evaluates accepted and rejected drop targets without reading DataTransfer payloads', () => {
		const base = {
			busy: false,
			capabilities: { copy: true, move: true, upload: true },
			internalPaths: ['/Source/report.txt'],
			modifiers: { altKey: false, ctrlKey: false },
		} as const;
		expect(
			evaluateFileManagerDropTarget({ ...base, source: 'internal', target: { kind: 'directory', path: '/Target' } }),
		).toEqual({ mode: 'move', state: 'accepted' });
		expect(
			evaluateFileManagerDropTarget({ ...base, source: 'external', target: { kind: 'directory', path: '/Target' } }),
		).toEqual({ mode: 'upload', state: 'accepted' });
		expect(
			evaluateFileManagerDropTarget({ ...base, source: 'internal', target: { kind: 'file', path: '/Target.txt' } }),
		).toEqual({ reason: '只能拖放到目录', state: 'rejected' });
		expect(
			evaluateFileManagerDropTarget({
				...base,
				capabilities: { ...base.capabilities, upload: false },
				source: 'external',
				target: { kind: 'directory', path: '/Target' },
			}),
		).toEqual({ reason: '当前文件系统为只读或未启用上传', state: 'rejected' });
		expect(
			evaluateFileManagerDropTarget({ ...base, source: 'unknown', target: { kind: 'file', path: '/Target.txt' } }),
		).toEqual({ state: 'ignored' });
	});

	it('rejects no-op, self, descendant, busy, and unsupported modifier targets', () => {
		const base = {
			busy: false,
			capabilities: { copy: true, move: true, upload: true },
			internalPaths: ['/Source'],
			modifiers: { altKey: false, ctrlKey: false },
			source: 'internal' as const,
		};
		expect(evaluateFileManagerDropTarget({ ...base, target: { kind: 'directory', path: '/Source' } })).toEqual({
			reason: '不能将目录拖放到自身或其子目录',
			state: 'rejected',
		});
		expect(evaluateFileManagerDropTarget({ ...base, target: { kind: 'directory', path: '/Source/Nested' } })).toEqual({
			reason: '不能将目录拖放到自身或其子目录',
			state: 'rejected',
		});
		expect(
			evaluateFileManagerDropTarget({
				...base,
				internalPaths: ['/Target/report.txt'],
				target: { kind: 'directory', path: '/Target' },
			}),
		).toEqual({ reason: '项目已位于目标目录', state: 'rejected' });
		expect(
			evaluateFileManagerDropTarget({ ...base, busy: true, target: { kind: 'directory', path: '/Target' } }),
		).toEqual({ reason: '当前有文件操作正在执行，请稍后重试', state: 'rejected' });
		expect(
			evaluateFileManagerDropTarget({
				...base,
				capabilities: { ...base.capabilities, copy: false },
				modifiers: { altKey: false, ctrlKey: true },
				target: { kind: 'directory', path: '/Target' },
			}),
		).toEqual({ reason: '当前不支持请求的复制或移动操作', state: 'rejected' });
	});

	it('uses copy modifiers without silently downgrading a disabled copy request', () => {
		expect(resolveFileManagerDropMode({ altKey: false, ctrlKey: false }, { copy: true, move: true })).toBe('move');
		expect(resolveFileManagerDropMode({ altKey: true, ctrlKey: false }, { copy: true, move: true })).toBe('copy');
		expect(resolveFileManagerDropMode({ altKey: false, ctrlKey: true }, { copy: false, move: true })).toBeUndefined();
		expect(resolveFileManagerDropMode({ altKey: false, ctrlKey: false }, { copy: true, move: false })).toBe('copy');
	});

	it('separates local files from unsupported directory entries', () => {
		const file = new File(['ok'], 'ok.txt');
		const dataTransfer = {
			files: [],
			items: [
				{ getAsFile: () => file, kind: 'file', webkitGetAsEntry: () => ({ isDirectory: false, name: file.name }) },
				{ getAsFile: () => null, kind: 'file', webkitGetAsEntry: () => ({ isDirectory: true, name: 'photos' }) },
			],
		} as unknown as DataTransfer;
		expect(extractFileManagerExternalDrop(dataTransfer)).toEqual({
			files: [file],
			rejected: [{ name: 'photos', reason: 'directory' }],
		});
	});

	it('does not re-add a recognized directory through the FileList fallback', () => {
		const fallback = new File(['directory fallback'], 'photos');
		const dataTransfer = {
			files: { 0: fallback, length: 1 },
			items: [{ getAsFile: () => null, kind: 'file', webkitGetAsEntry: () => ({ isDirectory: true, name: 'photos' }) }],
		} as unknown as DataTransfer;
		expect(extractFileManagerExternalDrop(dataTransfer)).toEqual({
			files: [],
			rejected: [{ name: 'photos', reason: 'directory' }],
		});
	});

	it('reports unreadable file-kind items instead of silently dropping them', () => {
		const dataTransfer = {
			files: [],
			items: [{ getAsFile: () => null, kind: 'file' }],
		} as unknown as DataTransfer;
		expect(extractFileManagerExternalDrop(dataTransfer)).toEqual({
			files: [],
			rejected: [{ name: '无法读取的拖入项目', reason: 'unreadable' }],
		});
	});

	it('bounds DataTransfer type probing without materializing large array-like values', () => {
		const types = { 0: 'Files', length: 1_000_000_000 } as unknown as DOMStringList;
		expect(hasBoundedDataTransferType(types, 'files', true)).toBe(true);
		const beyondBound = { 64: fileManagerDragDataType, length: 1_000_000_000 } as unknown as DOMStringList;
		expect(hasBoundedDataTransferType(beyondBound, fileManagerDragDataType)).toBe(false);
	});

	it('bounds FileList and DataTransfer materialization while preserving an omission summary', () => {
		const file = new File([], 'same.txt');
		let fileListReads = 0;
		const fileList = new Proxy(
			{ length: 1_000_000_000 },
			{
				get(target, property) {
					if (typeof property === 'string' && /^\d+$/.test(property)) {
						fileListReads += 1;
						return file;
					}
					return Reflect.get(target, property);
				},
			},
		) as unknown as FileList;
		const selected = collectFileManagerUploadFiles(fileList);
		expect(selected.files).toHaveLength(fileManagerUploadHardFileLimit - 1);
		expect(selected.rejected).toEqual([{ name: '其余 999995905 个项目', reason: 'too-many' }]);
		expect(fileListReads).toBe(fileManagerUploadHardFileLimit - 1);

		let itemReads = 0;
		const items = new Proxy(
			{ length: fileManagerUploadHardFileLimit + 2 },
			{
				get(target, property) {
					if (typeof property === 'string' && /^\d+$/.test(property)) {
						itemReads += 1;
						return { getAsFile: () => file, kind: 'file' };
					}
					return Reflect.get(target, property);
				},
			},
		) as unknown as DataTransferItemList;
		const dropped = extractFileManagerExternalDrop({ files: { length: 0 }, items } as unknown as DataTransfer);
		expect(dropped.files).toHaveLength(fileManagerUploadHardFileLimit - 1);
		expect(dropped.rejected).toEqual([{ name: '其余 3 个项目', reason: 'too-many' }]);
		expect(itemReads).toBe(fileManagerUploadHardFileLimit - 1);
	});

	it('retries failed and unattempted items without replaying completed work', () => {
		const operation = {
			type: 'upload' as const,
			directory: '/workspace',
			files: [new File(['a'], 'a.txt'), new File(['b'], 'b.txt'), new File(['c'], 'c.txt')],
			rejected: [{ name: 'folder', reason: 'directory' as const }],
		};
		const retry = createFileManagerRetryOperation({
			operation,
			outcome: 'failed',
			result: { completed: ['/workspace/a.txt'], failed: [{ path: '/workspace/b.txt', error: new Error('fail') }] },
		});
		expect(retry).toMatchObject({ type: 'upload', rejected: undefined });
		expect(retry?.type === 'upload' ? retry.files.map((file) => file.name) : []).toEqual(['b.txt', 'c.txt']);
	});

	it('refreshes only directories changed by completed operation items', () => {
		expect(
			getFileManagerOperationRefreshPlan(
				{ type: 'move', paths: ['/Source/a.txt', '/Other/b.txt'], destination: '/Target' },
				{
					completed: ['/Source/a.txt'],
					failed: [{ path: '/Other/b.txt', error: new Error('fail') }],
				},
			),
		).toEqual({ directories: ['/Target', '/Source'], removedPaths: ['/Source/a.txt'] });
		expect(
			getFileManagerOperationRefreshPlan(
				{ type: 'upload', directory: '/Target', files: [new File(['ok'], 'ok.txt')] },
				{ completed: ['/Target/ok.txt'], failed: [] },
			),
		).toEqual({ directories: ['/Target'], removedPaths: [] });
		expect(
			getFileManagerOperationRefreshPlan(
				{ type: 'download', paths: ['/Target/ok.txt'] },
				{ completed: ['/Target/ok.txt'], failed: [] },
			),
		).toEqual({ directories: [], removedPaths: [] });
	});

	it('maps common filesystem errors to stable user-facing messages', () => {
		expect(formatFileManagerOperationError(Object.assign(new Error('denied'), { code: 'EACCES' })).title).toContain(
			'权限',
		);
		expect(formatFileManagerOperationError(new DOMException('full', 'QuotaExceededError')).title).toContain('空间不足');
		expect(formatFileManagerOperationError(Object.assign(new Error('missing'), { code: 'ENOENT' })).title).toContain(
			'不存在',
		);
	});
});
