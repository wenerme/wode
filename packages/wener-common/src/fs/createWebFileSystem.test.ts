import { describe, expect, test } from 'vite-plus/test';
import { createWebFileSystem } from './createWebFileSystem';

describe('createWebFileSystem transfers', () => {
	test('does not disguise permission errors as missing entries', async () => {
		const root = new FakeDirectoryHandle('root');
		root.failFileAccessName = 'secret.txt';
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		await expect(fileSystem.exists('/secret.txt')).rejects.toMatchObject({ name: 'SecurityError' });
		await expect(fileSystem.writeFile('/secret.txt', 'data', { overwrite: false })).rejects.toMatchObject({
			name: 'SecurityError',
		});
		expect(root.names()).toEqual([]);
	});

	test('rejects every existing destination when overwrite is false and replaces directories without merging', async () => {
		const root = new FakeDirectoryHandle('root');
		root.directory('source').file('new.txt', 'new');
		root.directory('target').file('stale.txt', 'stale');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		await expect(fileSystem.copy('/source', '/target', { overwrite: false })).rejects.toMatchObject({ code: 'EEXIST' });
		expect(await fileSystem.readFile('/target/stale.txt', { encoding: 'text' })).toBe('stale');
		expect(await fileSystem.exists('/target/new.txt')).toBe(false);

		await fileSystem.copy('/source', '/target', { overwrite: true });
		expect(await fileSystem.readFile('/target/new.txt', { encoding: 'text' })).toBe('new');
		expect(await fileSystem.exists('/target/stale.txt')).toBe(false);
		expect(root.names().some((name) => name.startsWith('.wode-'))).toBe(false);
	});

	test('restores an existing destination when replacement from staging fails', async () => {
		const root = new FakeDirectoryHandle('root');
		root.directory('source').file('new.txt', 'new');
		root.directory('target').file('original.txt', 'original');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });
		root.failNextCreateName = 'target';

		await expect(fileSystem.copy('/source', '/target', { overwrite: true })).rejects.toThrow('Injected create failure');
		expect(await fileSystem.readFile('/target/original.txt', { encoding: 'text' })).toBe('original');
		expect(await fileSystem.exists('/target/new.txt')).toBe(false);
		expect(root.names().some((name) => name.startsWith('.wode-'))).toBe(false);
	});

	test('preflights incompatible destination types before replacing them', async () => {
		const root = new FakeDirectoryHandle('root');
		root.directory('source').file('child.txt', 'child');
		root.file('target', 'original');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		await expect(fileSystem.copy('/source', '/target', { overwrite: true })).rejects.toMatchObject({ code: 'ENOTDIR' });
		expect(await fileSystem.readFile('/target', { encoding: 'text' })).toBe('original');
	});

	test('rolls back a newly-created recursive destination when a child read fails', async () => {
		const root = new FakeDirectoryHandle('root');
		const source = root.directory('source');
		source.file('first.txt', 'first');
		source.file('broken.txt', 'broken').failReads = true;
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		await expect(fileSystem.copy('/source', '/target')).rejects.toThrow('Injected read failure');
		expect(await fileSystem.exists('/target')).toBe(false);
		expect(root.names()).toEqual(['source']);
	});

	test('keeps the rename source when the fallback copy does not complete', async () => {
		const root = new FakeDirectoryHandle('root');
		const source = root.directory('source');
		source.file('ok.txt', 'ok');
		source.file('broken.txt', 'broken').failReads = true;
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		await expect(fileSystem.rename('/source', '/renamed')).rejects.toThrow('Injected read failure');
		expect(await fileSystem.readFile('/source/ok.txt', { encoding: 'text' })).toBe('ok');
		expect(await fileSystem.exists('/renamed')).toBe(false);
	});

	test('restores the original destination when source removal fails after rename copy', async () => {
		const root = new FakeDirectoryHandle('root');
		root.directory('source').file('new.txt', 'new');
		root.directory('target').file('original.txt', 'original');
		root.failRemoveName = 'source';
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		await expect(fileSystem.rename('/source', '/target', { overwrite: true })).rejects.toThrow(
			'Injected remove failure',
		);
		expect(await fileSystem.readFile('/source/new.txt', { encoding: 'text' })).toBe('new');
		expect(await fileSystem.readFile('/target/original.txt', { encoding: 'text' })).toBe('original');
		expect(await fileSystem.exists('/target/new.txt')).toBe(false);
		expect(root.names().some((name) => name.startsWith('.wode-'))).toBe(false);
	});

	test('rejects root and overlapping transfer paths before reading the source', async () => {
		const root = new FakeDirectoryHandle('root');
		root.directory('tree').directory('child');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		await expect(fileSystem.copy('/', '/backup')).rejects.toMatchObject({ code: 'EINVAL' });
		await expect(fileSystem.copy('.', '/backup')).rejects.toMatchObject({ code: 'EINVAL' });
		await expect(fileSystem.copy('/tree', '/')).rejects.toMatchObject({ code: 'EINVAL' });
		await expect(fileSystem.copy('/tree', '/tree/child/copy')).rejects.toMatchObject({ code: 'EINVAL' });
		await expect(fileSystem.rename('/tree/child', '/tree', { overwrite: true })).rejects.toMatchObject({
			code: 'EINVAL',
		});
	});

	test('reports temporary cleanup failures after a successful copy', async () => {
		const root = new FakeDirectoryHandle('root');
		root.directory('source').file('value.txt', 'value');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });
		root.failRemovePrefix = '.wode-copy-';

		await expect(fileSystem.copy('/source', '/target')).rejects.toThrow(
			'Copy completed but temporary entries could not be cleaned up',
		);
		expect(await fileSystem.readFile('/target/value.txt', { encoding: 'text' })).toBe('value');
		expect(root.names().some((name) => name.startsWith('.wode-copy-'))).toBe(true);
	});
});

describe('createWebFileSystem directory reads', () => {
	test('rejects maxEntries overflow while iterating browser handles', async () => {
		const root = new FakeDirectoryHandle('root');
		root.file('a.txt', 'a');
		root.file('b.txt', 'b');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		await expect(fileSystem.readdir('/', { maxEntries: 1 })).rejects.toMatchObject({ code: 'EOVERFLOW' });
		expect(await fileSystem.readdir('/', { maxEntries: 2 })).toHaveLength(2);
		await expect(fileSystem.readdir('/', { maxEntries: 1.5 })).rejects.toMatchObject({ code: 'EINVAL' });
	});
});

describe('createWebFileSystem stream writes', () => {
	test('applies maxBytes before reading a browser file', async () => {
		const root = new FakeDirectoryHandle('root');
		root.file('bounded.txt', 'abcdef');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });

		expect(await fileSystem.readFile('/bounded.txt', { encoding: 'text', maxBytes: 3 })).toBe('abc');
		expect([...(await fileSystem.readFile('/bounded.txt', { maxBytes: 4 }))]).toEqual([97, 98, 99, 100]);
	});

	test('pipes stream chunks to createWritable with the supplied AbortSignal', async () => {
		const root = new FakeDirectoryHandle('root');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });
		const abortController = new AbortController();
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(bytes('stream '));
				controller.enqueue(bytes('content'));
				controller.close();
			},
		});

		await fileSystem.writeFile('/stream.txt', stream, { signal: abortController.signal });

		const written = root.fileHandle('stream.txt');
		expect(written.writes.map((chunk) => text(chunk))).toEqual(['stream ', 'content']);
		expect(await fileSystem.readFile('/stream.txt', { encoding: 'text' })).toBe('stream content');
	});

	test('aborts a stream write without committing partial content', async () => {
		const root = new FakeDirectoryHandle('root');
		const target = root.file('stream.txt', 'original');
		const fileSystem = createWebFileSystem({ root: root.asHandle() });
		const abortController = new AbortController();
		target.abortOnWrite = abortController;
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(bytes('partial'));
				controller.enqueue(bytes(' remainder'));
				controller.close();
			},
		});

		await expect(fileSystem.writeFile('/stream.txt', stream, { signal: abortController.signal })).rejects.toBeDefined();
		expect(await fileSystem.readFile('/stream.txt', { encoding: 'text' })).toBe('original');
	});

	test('removes a newly-created file when its stream write fails', async () => {
		const root = new FakeDirectoryHandle('root');
		root.abortNewFileName = 'new.txt';
		const fileSystem = createWebFileSystem({ root: root.asHandle() });
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(bytes('partial'));
				controller.close();
			},
		});

		await expect(fileSystem.writeFile('/new.txt', stream)).rejects.toBeDefined();
		expect(await fileSystem.exists('/new.txt')).toBe(false);
	});
});

class FakeDirectoryHandle {
	readonly kind = 'directory' as const;
	failNextCreateName?: string;
	failFileAccessName?: string;
	failRemovePrefix?: string;
	failRemoveName?: string;
	abortNewFileName?: string;
	private readonly entries = new Map<string, FakeDirectoryHandle | FakeFileHandle>();

	constructor(readonly name: string) {}

	asHandle(): FileSystemDirectoryHandle {
		return this as unknown as FileSystemDirectoryHandle;
	}

	directory(name: string): FakeDirectoryHandle {
		const existing = this.entries.get(name);
		if (existing instanceof FakeDirectoryHandle) return existing;
		if (existing) throw typeMismatch();
		const directory = new FakeDirectoryHandle(name);
		this.entries.set(name, directory);
		return directory;
	}

	file(name: string, content: string): FakeFileHandle {
		const existing = this.entries.get(name);
		if (existing instanceof FakeFileHandle) {
			existing.content = bytes(content);
			return existing;
		}
		if (existing) throw typeMismatch();
		const file = new FakeFileHandle(name, bytes(content));
		this.entries.set(name, file);
		return file;
	}

	fileHandle(name: string): FakeFileHandle {
		const entry = this.entries.get(name);
		if (!(entry instanceof FakeFileHandle)) throw notFound();
		return entry;
	}

	names(): string[] {
		return [...this.entries.keys()];
	}

	async getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle> {
		const entry = this.entries.get(name);
		if (entry instanceof FakeDirectoryHandle) return entry.asHandle();
		if (entry) throw typeMismatch();
		if (!options?.create) throw notFound();
		if (this.failNextCreateName === name) {
			this.failNextCreateName = undefined;
			throw new Error('Injected create failure');
		}
		return this.directory(name).asHandle();
	}

	async getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle> {
		if (this.failFileAccessName === name) throw new DOMException('Permission denied', 'SecurityError');
		const entry = this.entries.get(name);
		if (entry instanceof FakeFileHandle) return entry.asHandle();
		if (entry) throw typeMismatch();
		if (!options?.create) throw notFound();
		const file = new FakeFileHandle(name, new Uint8Array());
		if (this.abortNewFileName === name) file.failWrites = true;
		this.entries.set(name, file);
		return file.asHandle();
	}

	async removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void> {
		if (this.failRemoveName === name) throw new Error('Injected remove failure');
		if (this.failRemovePrefix && name.startsWith(this.failRemovePrefix)) throw new Error('Injected cleanup failure');
		const entry = this.entries.get(name);
		if (!entry) throw notFound();
		if (entry instanceof FakeDirectoryHandle && entry.entries.size > 0 && !options?.recursive) {
			throw new DOMException('Directory is not empty', 'InvalidModificationError');
		}
		this.entries.delete(name);
	}

	async *values(): AsyncGenerator<FileSystemHandle> {
		for (const entry of this.entries.values()) yield entry as unknown as FileSystemHandle;
	}
}

class FakeFileHandle {
	readonly kind = 'file' as const;
	failReads = false;
	abortOnWrite?: AbortController;
	failWrites = false;
	writes: Uint8Array[] = [];

	constructor(
		readonly name: string,
		public content: Uint8Array,
	) {}

	asHandle(): FileSystemFileHandle {
		return this as unknown as FileSystemFileHandle;
	}

	async getFile(): Promise<File> {
		if (this.failReads) throw new Error('Injected read failure');
		const content = this.content.slice();
		const blob = new Blob([content]);
		return Object.assign(blob, { name: this.name, lastModified: 1 }) as File;
	}

	async createWritable(): Promise<FileSystemWritableFileStream> {
		const chunks: Uint8Array[] = [];
		const stream = new WritableStream<unknown>({
			write: async (chunk) => {
				if (this.failWrites) throw new Error('Injected write failure');
				const data = await toBytes(chunk);
				chunks.push(data);
				this.writes.push(data);
				this.abortOnWrite?.abort(new DOMException('Injected abort', 'AbortError'));
				this.abortOnWrite = undefined;
			},
			close: () => {
				this.content = concat(chunks);
			},
		});
		return Object.assign(stream, {
			write: async (chunk: unknown) => withWriter(stream, (writer) => writer.write(chunk)),
			close: async () => withWriter(stream, (writer) => writer.close()),
			abort: async (reason?: unknown) => withWriter(stream, (writer) => writer.abort(reason)),
			seek: async () => undefined,
			truncate: async () => undefined,
		}) as FileSystemWritableFileStream;
	}
}

async function withWriter(
	stream: WritableStream<unknown>,
	operation: (writer: WritableStreamDefaultWriter<unknown>) => Promise<void>,
): Promise<void> {
	const writer = stream.getWriter();
	try {
		await operation(writer);
	} finally {
		writer.releaseLock();
	}
}

async function toBytes(value: unknown): Promise<Uint8Array> {
	if (typeof value === 'string') return bytes(value);
	if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
	if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
	if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
	throw new TypeError(`Unsupported fake write value: ${String(value)}`);
}

function concat(chunks: readonly Uint8Array[]): Uint8Array {
	const output = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.byteLength, 0));
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return output;
}

function bytes(value: string): Uint8Array {
	return new TextEncoder().encode(value);
}

function text(value: Uint8Array): string {
	return new TextDecoder().decode(value);
}

function notFound(): DOMException {
	return new DOMException('Not found', 'NotFoundError');
}

function typeMismatch(): DOMException {
	return new DOMException('Type mismatch', 'TypeMismatchError');
}
