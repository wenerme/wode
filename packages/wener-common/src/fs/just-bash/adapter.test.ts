import { describe, expect, it } from 'vite-plus/test';
import { createMemoryFileSystem } from '../createMemoryFileSystem';
import type { IFileStat, IFileSystem } from '../IFileSystem';
import {
	type CreateJustBashFileSystemAdapterOptions,
	createJustBashFileSystemAdapter,
	JustBashReadOnlyFileSystemError,
	JustBashUnsupportedFileSystemOperationError,
} from './adapter';
import { JustBashCopyLimitError, type JustBashCopyLimits, JustBashFileAllocationLimitError } from './adapterLimits';

type FixtureOptions = Pick<
	CreateJustBashFileSystemAdapterOptions,
	'readOnly' | 'onWorkspaceChanged' | 'maxReadBytes' | 'maxAppendBytes' | 'copyLimits'
>;

async function createFixture(options: FixtureOptions = {}) {
	const fs = createMemoryFileSystem();
	await fs.mkdir('/project', { recursive: true });
	const adapter = createJustBashFileSystemAdapter({
		fs,
		fsRoot: '/project',
		workspaceRoot: '/workspace',
		...options,
	});
	return { adapter, fs };
}

describe('createJustBashFileSystemAdapter', () => {
	it('contains normalized paths inside the workspace mount', async () => {
		const { adapter, fs } = await createFixture();
		await expect(adapter.writeFile('/workspace/../escape.txt', 'no')).rejects.toThrow('outside workspace');
		await expect(adapter.readFile('/etc/passwd')).rejects.toThrow('outside workspace');
		expect(await adapter.exists('/workspace/../../etc/passwd')).toBe(false);
		expect(await fs.exists('/escape.txt')).toBe(false);
		expect(adapter.resolvePath('/workspace/sub', '../../escape.txt')).toBe('/escape.txt');

		await adapter.writeFile('/workspace/..keep', 'kept');
		await expect(fs.readFile('/project/..keep', { encoding: 'text' })).resolves.toBe('kept');
	});

	it('rejects malicious readdir basenames and never follows returned entry paths', async () => {
		const fs = createMemoryFileSystem();
		await fs.mkdir('/project/source', { recursive: true });
		await fs.writeFile('/project/secret.txt', 'secret');
		let entries: IFileStat[] = [
			{
				name: '../secret.txt',
				path: '/project/secret.txt',
				directory: '/project',
				kind: 'file',
				mtime: 0,
				meta: {},
				size: 6,
			},
		];
		const maliciousFs = new Proxy(fs, {
			get(target, property) {
				if (property === 'readdir') return async () => entries;
				const value = Reflect.get(target, property, target);
				return typeof value === 'function' ? value.bind(target) : value;
			},
		});
		const adapter = createJustBashFileSystemAdapter({
			fs: maliciousFs,
			fsRoot: '/project',
			workspaceRoot: '/workspace',
		});

		const baseEntry = entries[0]!;
		for (const invalidName of ['', '.', '..', 'nested/file', 'nested\\file', 'nul\0file']) {
			entries = [{ ...baseEntry, name: invalidName }];
			await expect(adapter.readdir('/workspace/source')).rejects.toThrow('legal basename');
		}

		entries = [{ ...baseEntry, name: '../secret.txt' }];
		await expect(adapter.cp('/workspace/source', '/tmp/copy', { recursive: true })).rejects.toThrow('legal basename');
		expect(await adapter.exists('/tmp/secret.txt')).toBe(false);

		entries = [{ ...baseEntry, name: 'alias.txt' }];
		await expect(adapter.cp('/workspace/source', '/tmp/copy-path', { recursive: true })).rejects.toThrow(
			'File not found',
		);
		expect(await adapter.exists('/tmp/copy-path/alias.txt')).toBe(false);
	});

	it('shares text writes and appends with the backing IFileSystem', async () => {
		let changes = 0;
		const { adapter, fs } = await createFixture({ onWorkspaceChanged: () => changes++ });
		await adapter.writeFile('/workspace/note.txt', 'alpha');
		await adapter.appendFile('/workspace/note.txt', '\nbeta');

		await expect(fs.readFile('/project/note.txt', { encoding: 'text' })).resolves.toBe('alpha\nbeta');
		await expect(adapter.readFile('/workspace/note.txt', 'utf8')).resolves.toBe('alpha\nbeta');
		expect(changes).toBe(2);
	});

	it('keeps /tmp, /home, /dev/null and /dev/stdin virtual', async () => {
		const { adapter, fs } = await createFixture();
		await adapter.mkdir('/tmp/cache');
		await adapter.writeFile('/tmp/cache/result.txt', 'temporary');
		await adapter.writeFile('/home/user/profile', 'agent');
		await adapter.writeFile('/dev/null', 'discarded');
		await adapter.writeFile('/dev/stdin', 'input');

		await expect(adapter.readFile('/tmp/cache/result.txt')).resolves.toBe('temporary');
		await expect(adapter.readFile('/home/user/profile')).resolves.toBe('agent');
		await expect(adapter.readFile('/dev/null')).resolves.toBe('');
		await expect(adapter.readFile('/dev/stdin')).resolves.toBe('input');
		expect(await adapter.readdir('/')).toEqual(['dev', 'home', 'tmp', 'workspace']);
		await expect(adapter.mv('/dev/null', '/workspace/device-copy')).rejects.toThrow('protected path');
		expect(await fs.exists('/project/device-copy')).toBe(false);
		expect(await fs.exists('/project/tmp/cache/result.txt')).toBe(false);
	});

	it('matches recursive and existing-directory mkdir semantics', async () => {
		const { adapter } = await createFixture();
		await adapter.mkdir('/workspace/existing');
		await expect(adapter.mkdir('/workspace/existing')).rejects.toThrow('EEXIST');
		await expect(adapter.mkdir('/workspace/existing', { recursive: true })).resolves.toBeUndefined();
	});

	it('enforces read-only mode for backing and virtual mutations', async () => {
		const { adapter } = await createFixture({ readOnly: true });
		await expect(adapter.writeFile('/workspace/no.txt', 'no')).rejects.toBeInstanceOf(JustBashReadOnlyFileSystemError);
		await expect(adapter.mkdir('/tmp/no')).rejects.toBeInstanceOf(JustBashReadOnlyFileSystemError);
		await expect(adapter.rm('/dev/stdin')).rejects.toBeInstanceOf(JustBashReadOnlyFileSystemError);
	});

	it('preserves binary and explicit latin1 data without a Buffer global', async () => {
		const { adapter, fs } = await createFixture();
		const bufferDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Buffer');
		Object.defineProperty(globalThis, 'Buffer', { configurable: true, value: undefined, writable: true });
		try {
			await adapter.writeFile('/workspace/data.bin', '\u0000\u00ffA', 'latin1');
			await adapter.appendFile('/workspace/data.bin', 'Qg==', 'base64');
			await expect(adapter.readFile('/workspace/data.bin', 'latin1')).resolves.toBe('\u0000\u00ffAB');
			expect(Array.from(await adapter.readFileBuffer('/workspace/data.bin'))).toEqual([0, 255, 65, 66]);
			expect(Array.from(await fs.readFile('/project/data.bin'))).toEqual([0, 255, 65, 66]);
		} finally {
			if (bufferDescriptor) Object.defineProperty(globalThis, 'Buffer', bufferDescriptor);
			else Reflect.deleteProperty(globalThis, 'Buffer');
		}
	});

	it('bounds backing and virtual read, append and stdin allocation', async () => {
		const { adapter, fs } = await createFixture({ maxReadBytes: 8, maxAppendBytes: 8 });
		await fs.writeFile('/project/large.bin', new Uint8Array(9).fill(1));
		await expect(adapter.readFileBuffer('/workspace/large.bin')).rejects.toBeInstanceOf(
			JustBashFileAllocationLimitError,
		);

		await adapter.writeFile('/workspace/append.bin', '1234567');
		await expect(adapter.appendFile('/workspace/append.bin', '89')).rejects.toBeInstanceOf(
			JustBashFileAllocationLimitError,
		);
		await expect(fs.readFile('/project/append.bin', { encoding: 'text' })).resolves.toBe('1234567');

		await adapter.writeFile('/tmp/large.bin', new Uint8Array(9));
		await expect(adapter.readFileBuffer('/tmp/large.bin')).rejects.toBeInstanceOf(JustBashFileAllocationLimitError);
		await adapter.writeFile('/tmp/append.bin', '1234567');
		await expect(adapter.appendFile('/tmp/append.bin', '89')).rejects.toBeInstanceOf(JustBashFileAllocationLimitError);
		await expect(adapter.readFile('/tmp/append.bin')).resolves.toBe('1234567');
		expect(() => adapter.setExecutionContext({ stdin: '123456789' })).toThrow(JustBashFileAllocationLimitError);

		let observedMaxBytes: number | undefined;
		const racingFs = new Proxy(fs, {
			get(target, property) {
				if (property === 'stat') {
					return async (path: string) => ({ ...(await target.stat(path)), size: 1 });
				}
				if (property === 'readFile') {
					return async (path: string, options?: Parameters<IFileSystem['readFile']>[1]) => {
						observedMaxBytes = options?.maxBytes;
						return target.readFile(path, options);
					};
				}
				const value = Reflect.get(target, property, target);
				return typeof value === 'function' ? value.bind(target) : value;
			},
		});
		const racingAdapter = createJustBashFileSystemAdapter({
			fs: racingFs,
			fsRoot: '/project',
			workspaceRoot: '/workspace',
			maxReadBytes: 8,
		});
		await expect(racingAdapter.readFileBuffer('/workspace/large.bin')).rejects.toBeInstanceOf(
			JustBashFileAllocationLimitError,
		);
		expect(observedMaxBytes).toBe(9);
	});

	it('copies and moves files and directories across backing and virtual locations', async () => {
		const { adapter, fs } = await createFixture();
		await adapter.mkdir('/workspace/source', { recursive: true });
		await adapter.writeFile('/workspace/source/a.txt', 'a');
		await adapter.cp('/workspace/source', '/workspace/copy', { recursive: true });
		await adapter.mv('/workspace/copy/a.txt', '/tmp/moved.txt');
		await adapter.cp('/tmp/moved.txt', '/workspace/from-tmp.txt');

		await expect(fs.readFile('/project/source/a.txt', { encoding: 'text' })).resolves.toBe('a');
		await expect(fs.readFile('/project/from-tmp.txt', { encoding: 'text' })).resolves.toBe('a');
		expect(await fs.exists('/project/copy/a.txt')).toBe(false);
		await expect(adapter.readFile('/tmp/moved.txt')).resolves.toBe('a');
	});

	it.each([
		{
			name: 'file count',
			limits: { maxFiles: 2 },
			build: async (fs: IFileSystem) => {
				for (const name of ['a', 'b', 'c']) await fs.writeFile(`/project/source/${name}`, name);
			},
			limit: 'maxFiles',
		},
		{
			name: 'total entry count',
			limits: { maxEntries: 2 },
			build: async (fs: IFileSystem) => {
				await fs.writeFile('/project/source/a', 'a');
				await fs.writeFile('/project/source/b', 'b');
			},
			limit: 'maxEntries',
		},
		{
			name: 'directory count',
			limits: { maxDirectories: 1 },
			build: async (fs: IFileSystem) => {
				await fs.mkdir('/project/source/nested');
			},
			limit: 'maxDirectories',
		},
		{
			name: 'depth',
			limits: { maxDepth: 1 },
			build: async (fs: IFileSystem) => {
				await fs.mkdir('/project/source/one/two', { recursive: true });
			},
			limit: 'maxDepth',
		},
	] satisfies Array<{
		name: string;
		limits: Partial<JustBashCopyLimits>;
		build: (fs: IFileSystem) => Promise<void>;
		limit: keyof JustBashCopyLimits;
	}>)('preflights the recursive copy $name budget before destination writes', async ({ limits, build, limit }) => {
		const { adapter, fs } = await createFixture({ copyLimits: limits });
		await fs.mkdir('/project/source', { recursive: true });
		await build(fs);

		await expect(adapter.cp('/workspace/source', '/workspace/rejected', { recursive: true })).rejects.toMatchObject({
			name: 'JustBashCopyLimitError',
			limit,
		});
		expect(await fs.exists('/project/rejected')).toBe(false);
	});

	it('preflights the per-directory entry budget and rejects adapters that ignore maxEntries', async () => {
		const fs = createMemoryFileSystem();
		await fs.mkdir('/project/source', { recursive: true });
		await fs.writeFile('/project/source/a', 'a');
		await fs.writeFile('/project/source/b', 'b');
		let observedMaxEntries: number | undefined;
		const ignoringFs = new Proxy(fs, {
			get(target, property) {
				if (property === 'readdir') {
					return async (path: string, options?: Parameters<IFileSystem['readdir']>[1]) => {
						observedMaxEntries = options?.maxEntries;
						return target.readdir(path, { ...options, maxEntries: undefined });
					};
				}
				const value = Reflect.get(target, property, target);
				return typeof value === 'function' ? value.bind(target) : value;
			},
		});
		const adapter = createJustBashFileSystemAdapter({
			fs: ignoringFs,
			fsRoot: '/project',
			workspaceRoot: '/workspace',
			copyLimits: { maxDirectoryEntries: 1 },
		});

		await expect(adapter.readdir('/workspace/source')).rejects.toMatchObject({ code: 'EOVERFLOW' });
		await expect(adapter.cp('/workspace/source', '/workspace/rejected', { recursive: true })).rejects.toMatchObject({
			name: 'JustBashCopyLimitError',
			limit: 'maxDirectoryEntries',
		});
		expect(observedMaxEntries).toBe(1);
		expect(await fs.exists('/project/rejected')).toBe(false);
	});

	it('preloads aggregate bytes with a defensive read cap before destination writes', async () => {
		const fs = createMemoryFileSystem();
		await fs.mkdir('/project/source', { recursive: true });
		await fs.writeFile('/project/source/a', 'abc');
		await fs.writeFile('/project/source/b', 'def');
		let observedMaxBytes: number | undefined;
		const racingFs = new Proxy(fs, {
			get(target, property) {
				if (property === 'stat') {
					return async (path: string, options?: Parameters<IFileSystem['stat']>[1]) => ({
						...(await target.stat(path, options)),
						size: path.endsWith('/b') ? 1 : (await target.stat(path, options)).size,
					});
				}
				if (property === 'readFile') {
					return async (path: string, options?: Parameters<IFileSystem['readFile']>[1]) => {
						if (path.endsWith('/b')) observedMaxBytes = options?.maxBytes;
						return target.readFile(path, options);
					};
				}
				const value = Reflect.get(target, property, target);
				return typeof value === 'function' ? value.bind(target) : value;
			},
		});
		const adapter = createJustBashFileSystemAdapter({
			fs: racingFs,
			fsRoot: '/project',
			workspaceRoot: '/workspace',
			copyLimits: { maxBytes: 5 },
		});

		await expect(adapter.cp('/workspace/source', '/workspace/rejected', { recursive: true })).rejects.toBeInstanceOf(
			JustBashCopyLimitError,
		);
		expect(observedMaxBytes).toBe(3);
		expect(await fs.exists('/project/rejected')).toBe(false);
	});

	it('honors AbortSignal during copy preflight without creating destination artifacts', async () => {
		const fs = createMemoryFileSystem();
		await fs.mkdir('/project/source', { recursive: true });
		await fs.writeFile('/project/source/a', 'a');
		const controller = new AbortController();
		const abortingFs = new Proxy(fs, {
			get(target, property) {
				if (property === 'readdir') {
					return async (path: string, options?: Parameters<IFileSystem['readdir']>[1]) => {
						const entries = await target.readdir(path, options);
						controller.abort(new DOMException('Stopped', 'AbortError'));
						return entries;
					};
				}
				const value = Reflect.get(target, property, target);
				return typeof value === 'function' ? value.bind(target) : value;
			},
		});
		const adapter = createJustBashFileSystemAdapter({
			fs: abortingFs,
			fsRoot: '/project',
			workspaceRoot: '/workspace',
		});
		adapter.setExecutionContext({ signal: controller.signal });
		try {
			await expect(adapter.cp('/workspace/source', '/workspace/rejected', { recursive: true })).rejects.toMatchObject({
				name: 'AbortError',
			});
		} finally {
			adapter.clearExecutionContext();
		}
		expect(await fs.exists('/project/rejected')).toBe(false);
	});

	it('copies a real tree at exact inclusive budget boundaries', async () => {
		const { adapter, fs } = await createFixture({
			copyLimits: {
				maxEntries: 4,
				maxFiles: 2,
				maxDirectories: 2,
				maxDepth: 2,
				maxDirectoryEntries: 2,
				maxBytes: 3,
			},
		});
		await fs.mkdir('/project/source/nested', { recursive: true });
		await fs.writeFile('/project/source/a', 'a');
		await fs.writeFile('/project/source/nested/b', 'bc');

		await adapter.cp('/workspace/source', '/workspace/copied', { recursive: true });

		await expect(fs.readFile('/project/copied/a', { encoding: 'text' })).resolves.toBe('a');
		await expect(fs.readFile('/project/copied/nested/b', { encoding: 'text' })).resolves.toBe('bc');
	});

	it('supports stat, directory entries, realpath and utimes while rejecting links', async () => {
		let changes = 0;
		const { adapter } = await createFixture({ onWorkspaceChanged: () => changes++ });
		await adapter.writeFile('/workspace/a.txt', 'a');
		const before = await adapter.stat('/workspace/a.txt');
		await adapter.utimes('/workspace/a.txt', new Date(1), new Date(2));

		expect(before).toMatchObject({ isFile: true, isDirectory: false, size: 1 });
		expect((await adapter.stat('/workspace/a.txt')).mtime).toEqual(new Date(2));
		expect(await adapter.readdirWithFileTypes?.('/workspace')).toEqual([
			{ name: 'a.txt', isFile: true, isDirectory: false, isSymbolicLink: false },
		]);
		await expect(adapter.realpath('/workspace/./a.txt')).resolves.toBe('/workspace/a.txt');
		expect(changes).toBe(2);
		await expect(adapter.symlink('a.txt', '/workspace/link')).rejects.toBeInstanceOf(
			JustBashUnsupportedFileSystemOperationError,
		);
		await expect(adapter.link('/workspace/a.txt', '/workspace/link')).rejects.toBeInstanceOf(
			JustBashUnsupportedFileSystemOperationError,
		);
		await expect(adapter.readlink('/workspace/a.txt')).rejects.toBeInstanceOf(
			JustBashUnsupportedFileSystemOperationError,
		);
	});
});
