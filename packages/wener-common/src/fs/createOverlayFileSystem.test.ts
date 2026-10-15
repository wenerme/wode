import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMemoryFileSystem } from './createMemoryFileSystem';
import { createOverlayFileSystem, type OverlayFileSystem, OverlayOpaqueMarker } from './createOverlayFileSystem';
import { FileSystemError } from './FileSystemError';
import type { ReaddirOptions } from './IFileSystem';
import { createNodeFileSystem } from './server/createNodeFileSystem';
import { runFileSystemTest } from './tests/runFileSystemTest';

const directories: string[] = [];
afterEach(async () => {
	for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true });
});

async function tempDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'overlay-fs-'));
	directories.push(directory);
	return directory;
}

async function text(fs: Pick<OverlayFileSystem, 'readFile'>, path: string): Promise<string> {
	return fs.readFile(path, { encoding: 'text' });
}

async function names(fs: Pick<OverlayFileSystem, 'readdir'>, path: string): Promise<string[]> {
	return (await fs.readdir(path)).map((entry) => entry.name);
}

describe('createOverlayFileSystem', () => {
	test('满足 IFileSystem 合同，lower 保持只读', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/README.txt', 'hello');
		const fs = createOverlayFileSystem({ lower });

		await runFileSystemTest(fs);
		expect(await lower.readFile('/README.txt', { encoding: 'text' })).toBe('hello');
	});

	test('读先查 upper 再落 lower，写只进 upper', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/a.txt', 'lower-a');
		const fs = createOverlayFileSystem({ lower });

		expect(await text(fs, '/a.txt')).toBe('lower-a');
		await fs.writeFile('/a.txt', 'upper-a');
		await fs.writeFile('/new/b.txt', 'b');

		expect(await text(fs, '/a.txt')).toBe('upper-a');
		expect(await text(fs, '/new/b.txt')).toBe('b');
		expect(await text(fs.upper, '/a.txt')).toBe('upper-a');
		expect(await lower.readFile('/a.txt', { encoding: 'text' })).toBe('lower-a');
	});

	test('删除 lower 条目写 whiteout，重新写入时清除标记', async () => {
		const lower = createMemoryFileSystem();
		await lower.mkdir('/src', { recursive: true });
		await lower.writeFile('/src/a.ts', 'a');
		await lower.writeFile('/src/b.ts', 'b');
		const fs = createOverlayFileSystem({ lower });

		await fs.rm('/src/a.ts');
		expect(await fs.exists('/src/a.ts')).toBe(false);
		expect(await names(fs, '/src')).toEqual(['b.ts']);
		expect(await names(fs.upper, '/src')).toEqual(['.wh.a.ts']);
		expect(await fs.exists('/src/.wh.a.ts')).toBe(false);
		await expect(fs.writeFile('/src/.wh.x', 'x')).rejects.toMatchObject({ code: 'EINVAL' });

		await fs.writeFile('/src/a.ts', 'again');
		expect(await text(fs, '/src/a.ts')).toBe('again');
		expect(await names(fs.upper, '/src')).toEqual(['a.ts']);
	});

	test('删除并重建 lower 目录时屏蔽旧内容', async () => {
		const lower = createMemoryFileSystem();
		await lower.mkdir('/dist/assets', { recursive: true });
		await lower.writeFile('/dist/old.js', 'old');
		await lower.writeFile('/dist/assets/x.png', 'x');
		const fs = createOverlayFileSystem({ lower });

		await fs.rm('/dist', { recursive: true });
		await fs.writeFile('/dist/new.js', 'new');

		expect(await names(fs, '/dist')).toEqual(['new.js']);
		expect(await names(fs.upper, '/dist')).toEqual([OverlayOpaqueMarker, 'new.js']);
		expect(await fs.exists('/dist/assets/x.png')).toBe(false);
	});

	test('规范化路径并拒绝根目录自复制', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/a.txt', 'a');
		const fs = createOverlayFileSystem({ lower });

		expect(await text(fs, '//a.txt')).toBe('a');
		await expect(fs.copy('/', '/x')).rejects.toMatchObject({ code: 'EINVAL' });
		expect(await fs.exists('/x')).toBe(false);
	});

	test('带枚举限额的请求在调用底层前明确失败', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/a', 'a');
		await lower.writeFile('/b', 'b');
		await lower.writeFile('/.wh.meta', 'reserved');
		const fs = createOverlayFileSystem({ lower });
		const lowerRead = vi.spyOn(lower, 'readdir');
		const upperRead = vi.spyOn(fs.upper, 'readdir');
		await expect(fs.readdir('/', { maxEntries: 1 })).rejects.toMatchObject({ code: 'ENOTSUP' });
		await expect(fs.readdir('/', { maxEntries: 0 })).rejects.toMatchObject({ code: 'ENOTSUP' });
		await expect(fs.readdir('/', { maxEntries: -1 })).rejects.toMatchObject({ code: 'EINVAL' });
		expect(lowerRead).not.toHaveBeenCalled();
		expect(upperRead).not.toHaveBeenCalled();
		expect(await names(fs, '/')).toEqual(['a', 'b']);
	});

	test('lower 文件 rename 上移，含 lower 内容的目录 rename 返回 EXDEV', async () => {
		const lower = createMemoryFileSystem();
		await lower.mkdir('/lib', { recursive: true });
		await lower.writeFile('/lib/old.ts', 'code');
		const fs = createOverlayFileSystem({ lower });

		await fs.rename('/lib/old.ts', '/lib/new.ts');
		expect(await fs.exists('/lib/old.ts')).toBe(false);
		expect(await text(fs, '/lib/new.ts')).toBe('code');
		await expect(fs.rename('/lib', '/src')).rejects.toMatchObject({ code: 'EXDEV' });
	});

	test('copy 读取合并视图并写入 upper', async () => {
		const lower = createMemoryFileSystem();
		await lower.mkdir('/tpl/sub', { recursive: true });
		await lower.writeFile('/tpl/a.txt', 'a');
		await lower.writeFile('/tpl/sub/b.txt', 'b');
		const fs = createOverlayFileSystem({ lower });

		await fs.rm('/tpl/sub/b.txt');
		await fs.writeFile('/tpl/c.txt', 'c');
		await fs.copy('/tpl', '/app');

		expect(await names(fs, '/app')).toEqual(['a.txt', 'c.txt', 'sub']);
		expect(await names(fs, '/app/sub')).toEqual([]);
		expect(await lower.exists('/app')).toBe(false);
	});

	test('changes 列出相对 lower 的差异，reset 恢复快照', async () => {
		const lower = createMemoryFileSystem();
		await lower.mkdir('/src', { recursive: true });
		await lower.writeFile('/src/a.ts', 'a');
		await lower.writeFile('/src/b.ts', 'b');
		const fs = createOverlayFileSystem({ lower });

		await fs.writeFile('/src/a.ts', 'a2');
		await fs.rm('/src/b.ts');
		await fs.writeFile('/src/c.ts', 'c');
		await fs.writeFile('/docs/guide.md', 'g');

		expect(await fs.changes()).toEqual([
			{ path: '/docs', kind: 'added', type: 'directory' },
			{ path: '/docs/guide.md', kind: 'added', type: 'file' },
			{ path: '/src/a.ts', kind: 'modified', type: 'file' },
			{ path: '/src/b.ts', kind: 'deleted', type: 'file' },
			{ path: '/src/c.ts', kind: 'added', type: 'file' },
		]);

		await fs.reset();
		expect(await fs.changes()).toEqual([]);
		expect(await text(fs, '/src/a.ts')).toBe('a');
		expect(await fs.exists('/docs')).toBe(false);
	});

	test('overlay 可以作为 lower 形成快照链', async () => {
		const fixture = createMemoryFileSystem();
		await fixture.writeFile('/data.csv', 'a,b\n');
		const base = createOverlayFileSystem({ lower: fixture });
		await base.writeFile('/seed.json', '{}');
		await base.rm('/data.csv');
		const clone = createOverlayFileSystem({ lower: base });

		expect(await names(clone, '/')).toEqual(['seed.json']);
		await clone.writeFile('/out.txt', 'result');
		expect(await clone.changes()).toEqual([{ path: '/out.txt', kind: 'added', type: 'file' }]);
		expect(await base.exists('/out.txt')).toBe(false);
	});

	test('流读写按层分发', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/log.txt', 'lower-log');
		const fs = createOverlayFileSystem({ lower });

		expect(await new Response(fs.createReadableStream!('/log.txt')).text()).toBe('lower-log');
		await fs.rm('/log.txt');
		const writer = fs.createWritableStream!('/log.txt').getWriter();
		await writer.write(new TextEncoder().encode('upper-log'));
		await writer.close();
		expect(await new Response(fs.createReadableStream!('/log.txt')).text()).toBe('upper-log');
	});

	test('Node lower 与 upper 满足公共合同且不修改 lower', async () => {
		const lowerRoot = await tempDirectory();
		const upperRoot = await tempDirectory();
		await writeFile(join(lowerRoot, 'README.txt'), 'hello');
		const fs = createOverlayFileSystem({
			lower: createNodeFileSystem({ root: lowerRoot }),
			upper: createNodeFileSystem({ root: upperRoot }),
		});

		await runFileSystemTest(fs);
		expect(await readdir(lowerRoot)).toEqual(['README.txt']);
		expect(await readFile(join(lowerRoot, 'README.txt'), 'utf8')).toBe('hello');
		expect(await fs.exists('/missing')).toBe(false);
	});

	test('Node lower 配合默认内存 upper 支持新建文件与流写入', async () => {
		const lowerRoot = await tempDirectory();
		const fs = createOverlayFileSystem({ lower: createNodeFileSystem({ root: lowerRoot }) });
		await fs.writeFile('/new.txt', 'new');
		const writer = fs.createWritableStream!('/stream.txt').getWriter();
		await writer.write('stream');
		await writer.close();
		expect(await text(fs, '/stream.txt')).toBe('stream');
		expect(await readdir(lowerRoot)).toEqual([]);
	});

	test('未配置 root 的 Node lower 保留缺失路径错误码并允许写入 upper', async () => {
		const root = await tempDirectory();
		const target = join(root, 'missing');
		const lower = createNodeFileSystem();
		await expect(lower.stat(target)).rejects.toMatchObject({ code: 'ENOENT' });
		const fs = createOverlayFileSystem({ lower });
		expect(await fs.exists(target)).toBe(false);
		await fs.writeFile(target, 'upper');
		expect(await text(fs, target)).toBe('upper');
		expect(await readdir(root)).toEqual([]);
	});

	test('探测时不吞掉权限错误', async () => {
		const lower = createMemoryFileSystem();
		const upper = createMemoryFileSystem();
		vi.spyOn(upper, 'stat').mockRejectedValue(new FileSystemError('denied', 'EACCES'));
		const fs = createOverlayFileSystem({ lower, upper });
		await expect(fs.exists('/a')).rejects.toMatchObject({ code: 'EACCES' });
	});

	test('覆盖复制容量不足时保留原目标', async () => {
		const lower = createMemoryFileSystem();
		const upper = createMemoryFileSystem({ maxBytes: 4 });
		await lower.writeFile('/source', '12345');
		await upper.writeFile('/target', 'old');
		const fs = createOverlayFileSystem({ lower, upper });
		await expect(fs.copy('/source', '/target', { overwrite: true })).rejects.toMatchObject({ code: 'ENOSPC' });
		expect(await text(fs, '/target')).toBe('old');
		expect(await names(upper, '/')).toEqual(['target']);
	});

	test('跨层文件 rename 读取源失败时保留目标和源', async () => {
		const lower = createMemoryFileSystem();
		const upper = createMemoryFileSystem();
		await lower.writeFile('/source', 'source');
		await upper.writeFile('/target', 'old');
		vi.spyOn(lower, 'readFile').mockRejectedValue(new FileSystemError('read failed', 'EIO'));
		const fs = createOverlayFileSystem({ lower, upper });
		await expect(fs.rename('/source', '/target', { overwrite: true })).rejects.toMatchObject({ code: 'EIO' });
		expect(await text(fs, '/target')).toBe('old');
		expect(await lower.exists('/source')).toBe(true);
	});

	test('写流 close 与后续 overwrite:false 写入按顺序执行', async () => {
		const fs = createOverlayFileSystem({ lower: createMemoryFileSystem() });
		const writer = fs.createWritableStream!('/a', { overwrite: false }).getWriter();
		await writer.write('stream');
		const later = expect(fs.writeFile('/a', 'later', { overwrite: false })).rejects.toMatchObject({ code: 'EEXIST' });
		await writer.close();
		await later;
		expect(await text(fs, '/a')).toBe('stream');
	});

	test('写流结束后才执行目录 rename，不重建旧目录', async () => {
		const fs = createOverlayFileSystem({ lower: createMemoryFileSystem() });
		const writer = fs.createWritableStream!('/dir/new').getWriter();
		await writer.write('stream');
		const renamed = fs.rename('/dir', '/moved');
		await writer.close();
		await renamed;
		expect(await text(fs, '/moved/new')).toBe('stream');
		expect(await fs.exists('/dir')).toBe(false);
	});

	test('删除与 reset 等待活动写流结束，目录不会被迟到提交重新创建', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/dir/old', 'old');
		const fs = createOverlayFileSystem({ lower });
		const writer = fs.createWritableStream!('/dir/new').getWriter();
		await writer.write('new');
		const removed = fs.rm('/dir', { recursive: true });
		await writer.close();
		await removed;
		expect(await fs.exists('/dir')).toBe(false);
		expect(await fs.changes()).toEqual([{ path: '/dir', kind: 'deleted', type: 'directory' }]);
		const recreated = fs.createWritableStream!('/dir/new').getWriter();
		await recreated.write('new');
		const reset = fs.reset();
		await recreated.close();
		await reset;
		expect(await names(fs, '/dir')).toEqual(['old']);
		expect(await fs.changes()).toEqual([]);
	});

	test('写流 abort、容量失败和 signal 取消后释放变更队列', async () => {
		const fs = createOverlayFileSystem({
			lower: createMemoryFileSystem(),
			upper: createMemoryFileSystem({ maxBytes: 4 }),
		});
		const aborted = fs.createWritableStream!('/aborted').getWriter();
		await aborted.write('a');
		await aborted.abort('stop');
		const overflow = fs.createWritableStream!('/overflow').getWriter();
		await expect(overflow.write('12345')).rejects.toMatchObject({ code: 'ENOSPC' });
		const controller = new AbortController();
		const cancelled = fs.createWritableStream!('/cancelled', { signal: controller.signal }).getWriter();
		await cancelled.write('a');
		const closed = expect(cancelled.closed).rejects.toMatchObject({ code: 'ABORT_ERR' });
		controller.abort();
		await closed;
		await fs.writeFile('/after', 'ok');
		expect(await text(fs, '/after')).toBe('ok');
	});

	test('根 opaque 通过根替换表达隐藏的 lower 内容', async () => {
		const lower = createMemoryFileSystem();
		const upper = createMemoryFileSystem();
		await lower.writeFile('/a', 'a');
		await lower.writeFile('/b', 'b');
		await upper.writeFile(`/${OverlayOpaqueMarker}`, '');
		await upper.writeFile('/a', 'new');
		const fs = createOverlayFileSystem({ lower, upper });
		expect(await fs.exists('/b')).toBe(false);
		expect(await fs.changes()).toEqual([
			{ path: '/', kind: 'replaced', type: 'directory' },
			{ path: '/a', kind: 'added', type: 'file' },
		]);
	});

	test.each<ReaddirOptions>([
		{ kind: 'directory' },
		{ hidden: false },
		{ glob: '*.txt' },
		{ recursive: true },
		{ depth: 2 },
	])('明确拒绝未实现的目录选项 %j', async (options) => {
		const fs = createOverlayFileSystem({ lower: createMemoryFileSystem() });
		await expect(fs.readdir('/', options)).rejects.toMatchObject({ code: 'ENOTSUP' });
	});

	test('忽略 lower 中的保留名称，避免将普通文件复制为控制标记', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/dir/.wh.meta', 'reserved');
		await lower.writeFile('/dir/visible', 'visible');
		const fs = createOverlayFileSystem({ lower });
		expect(await names(fs, '/dir')).toEqual(['visible']);
		await fs.copy('/dir', '/copied');
		expect(await names(fs.upper, '/copied')).toEqual(['visible']);
	});

	test('异步探测期间取消读流不会打开底层流', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/a', 'a');
		const gate = Promise.withResolvers<void>();
		const probed = Promise.withResolvers<void>();
		const stat = lower.stat.bind(lower);
		vi.spyOn(lower, 'stat').mockImplementation(async (path, options) => {
			probed.resolve();
			await gate.promise;
			return stat(path, options);
		});
		const open = vi.spyOn(lower, 'createReadableStream');
		const fs = createOverlayFileSystem({ lower });
		const stream = fs.createReadableStream!('/a');
		await probed.promise;
		await stream.cancel('stop');
		gate.resolve();
		await Promise.resolve();
		await Promise.resolve();
		expect(open).not.toHaveBeenCalled();
	});

	test('底层读流取消失败时仍释放 reader 锁', async () => {
		const lower = createMemoryFileSystem();
		await lower.writeFile('/a', 'a');
		const opened = Promise.withResolvers<void>();
		const stream = new ReadableStream<Uint8Array>({
			cancel() {
				throw new Error('cancel failed');
			},
		});
		vi.spyOn(lower, 'createReadableStream').mockImplementation(() => {
			opened.resolve();
			return stream;
		});
		const fs = createOverlayFileSystem({ lower });
		const overlayStream = fs.createReadableStream!('/a');
		await opened.promise;
		await expect(overlayStream.cancel('stop')).rejects.toThrow('cancel failed');
		expect(stream.locked).toBe(false);
	});

	test('upper 和 lower 不能使用同一个文件系统', () => {
		const lower = createMemoryFileSystem();
		expect(() => createOverlayFileSystem({ lower, upper: lower })).toThrowError(
			expect.objectContaining({ code: 'EINVAL' }),
		);
	});
});
