import type { BufferEncoding, FsStat as JustBashFsStat } from 'just-bash';
import type { IFileSystem } from '../IFileSystem';
import { assertReaddirEntryLimit } from '../readdirLimit';
import {
	directoryDirent,
	mergeDirents,
	syntheticDirectoryStat,
	toJustBashDirent,
	toJustBashStat,
} from './adapterEntries';
import {
	DefaultJustBashAdapterMaxAppendBytes,
	DefaultJustBashAdapterMaxReadBytes,
	type JustBashCopyLimits,
	JustBashFileAllocationLimitError,
	validateAdapterAllocationLimit,
	validateAdapterCopyLimits,
} from './adapterLimits';
import {
	type CreateJustBashFileSystemAdapterOptions,
	type JustBashFileSystemAdapter,
	type JustBashFileSystemExecutionContext,
	JustBashReadOnlyFileSystemError,
	JustBashUnsupportedFileSystemOperationError,
} from './adapterTypes';
import { executeJustBashCopy } from './copyExecution';
import { type JustBashPathLocation, readJustBashCopyFile } from './copyReader';
import {
	byteStringFromUint8Array,
	decodeFileContent,
	encodedFileContentByteLength,
	encodeFileContent,
} from './encoding';
import {
	assertWorkspaceRootAvailable,
	childVirtualPath,
	getMountAncestors,
	isPathWithin,
	isProtectedVirtualSystemPath,
	isVirtualSystemPath,
	mapWorkspacePath,
	normalizeRootPath,
	normalizeVirtualPath,
	parentVirtualPath,
	resolveVirtualPath,
	virtualBasename,
} from './paths';
import { type JustBashDirent, JustBashVirtualFileSystem } from './virtualFileSystem';

export type {
	CreateJustBashFileSystemAdapterOptions,
	JustBashFileSystemAdapter,
	JustBashFileSystemExecutionContext,
} from './adapterTypes';
export { JustBashReadOnlyFileSystemError, JustBashUnsupportedFileSystemOperationError } from './adapterTypes';

type JustBashReadFileOptions = { encoding?: BufferEncoding | null };
type JustBashWriteFileOptions = { encoding?: BufferEncoding };
type WriteOptions = JustBashWriteFileOptions | BufferEncoding | undefined;

export function createJustBashFileSystemAdapter(
	options: CreateJustBashFileSystemAdapterOptions,
): JustBashFileSystemAdapter {
	return new JustBashFileSystemAdapterImplementation(options);
}

class JustBashFileSystemAdapterImplementation implements JustBashFileSystemAdapter {
	private readonly fs: IFileSystem;
	private readonly workspaceRoot: string;
	private readonly fsRoot: string;
	private readonly readOnly: boolean;
	private readonly maxReadBytes: number;
	private readonly maxAppendBytes: number;
	private readonly copyLimits: Readonly<JustBashCopyLimits>;
	private readonly onWorkspaceChanged?: () => void;
	private readonly virtualFs = new JustBashVirtualFileSystem();
	private readonly mountAncestors: readonly string[];
	private readonly knownPaths = new Set<string>();
	private readonly mtimeOverrides = new Map<string, number>();
	private executionSignal?: AbortSignal;
	private executionContextActive = false;

	constructor({
		fs,
		workspaceRoot = '/workspace',
		fsRoot = '/',
		readOnly = false,
		maxReadBytes = DefaultJustBashAdapterMaxReadBytes,
		maxAppendBytes = DefaultJustBashAdapterMaxAppendBytes,
		copyLimits,
		onWorkspaceChanged,
	}: CreateJustBashFileSystemAdapterOptions) {
		this.fs = fs;
		this.workspaceRoot = normalizeRootPath(workspaceRoot, 'workspaceRoot');
		this.fsRoot = normalizeRootPath(fsRoot, 'fsRoot');
		assertWorkspaceRootAvailable(this.workspaceRoot);
		this.readOnly = readOnly;
		this.maxReadBytes = validateAdapterAllocationLimit('maxReadBytes', maxReadBytes);
		this.maxAppendBytes = validateAdapterAllocationLimit('maxAppendBytes', maxAppendBytes);
		this.copyLimits = validateAdapterCopyLimits(copyLimits);
		this.onWorkspaceChanged = onWorkspaceChanged;
		this.mountAncestors = getMountAncestors(this.workspaceRoot);
		for (const path of this.mountAncestors) this.knownPaths.add(path);
	}

	setExecutionContext({ signal, stdin = '', stdinKind = 'text' }: JustBashFileSystemExecutionContext): void {
		if (this.executionContextActive) throw new Error('Just-bash filesystem execution is already active');
		const encoding = stdinKind === 'bytes' ? 'latin1' : 'utf8';
		if (encodedFileContentByteLength(stdin, encoding) > this.maxReadBytes) {
			throw new JustBashFileAllocationLimitError('stdin', this.maxReadBytes);
		}
		this.executionContextActive = true;
		this.executionSignal = signal;
		this.virtualFs.setStdin(encodeFileContent(stdin, encoding));
	}

	clearExecutionContext(): void {
		this.executionSignal = undefined;
		this.executionContextActive = false;
		this.virtualFs.clearStdin();
	}

	async readFile(path: string, options?: JustBashReadFileOptions | BufferEncoding): Promise<string> {
		const bytes = await this.readFileBuffer(path);
		const encoding = (typeof options === 'string' ? options : options?.encoding) ?? 'utf8';
		return decodeFileContent(bytes, encoding);
	}

	async readFileBytes(path: string) {
		return byteStringFromUint8Array(await this.readFileBuffer(path));
	}

	async readFileBuffer(path: string): Promise<Uint8Array> {
		const normalized = normalizeVirtualPath(path);
		switch (this.locate(normalized)) {
			case 'virtual':
				if (this.virtualFs.stat(normalized).size > this.maxReadBytes) {
					throw new JustBashFileAllocationLimitError('readFile', this.maxReadBytes);
				}
				return this.virtualFs.readFile(normalized);
			case 'backing':
				return this.readBackingFileBuffer(normalized, this.maxReadBytes, 'readFile');
			case 'synthetic':
				throw new Error(`EISDIR: illegal operation on a directory, open '${path}'`);
			default:
				throw new Error(`ENOENT: no such file or directory, open '${path}'`);
		}
	}

	async writeFile(path: string, content: string | Uint8Array, options?: WriteOptions): Promise<void> {
		this.assertWritable('writeFile');
		const normalized = normalizeVirtualPath(path);
		const bytes = encodeFileContent(content, options);
		if (this.locate(normalized) === 'virtual') {
			this.virtualFs.writeFile(normalized, bytes);
			return;
		}
		this.assertBackingLocation(normalized);
		await this.assertBackingParent(normalized);
		await this.fs.writeFile(this.toBackingPath(normalized), bytes, {
			overwrite: true,
			signal: this.executionSignal,
		});
		this.mtimeOverrides.delete(normalized);
		this.remember(normalized);
		this.markWorkspaceChanged();
	}

	async appendFile(path: string, content: string | Uint8Array, options?: WriteOptions): Promise<void> {
		this.assertWritable('appendFile');
		const normalized = normalizeVirtualPath(path);
		const location = this.locate(normalized);
		if (location === 'virtual' && normalized === '/dev/null') return;
		const contentSize = encodedFileContentByteLength(content, options);
		if (contentSize > this.maxAppendBytes) {
			throw new JustBashFileAllocationLimitError('appendFile', this.maxAppendBytes);
		}
		if (location === 'virtual') {
			const existingSize = this.virtualFs.exists(normalized) ? this.virtualFs.stat(normalized).size : 0;
			if (existingSize + contentSize > this.maxAppendBytes) {
				throw new JustBashFileAllocationLimitError('appendFile', this.maxAppendBytes);
			}
			this.virtualFs.appendFile(normalized, encodeFileContent(content, options));
			return;
		}
		const bytes = encodeFileContent(content, options);
		this.assertBackingLocation(normalized);
		await this.assertBackingParent(normalized);
		const backingPath = this.toBackingPath(normalized);
		const existing = (await this.fs.exists(backingPath))
			? await this.readBackingFileBuffer(
					normalized,
					this.maxAppendBytes - bytes.byteLength,
					'appendFile',
					this.maxAppendBytes,
				)
			: new Uint8Array();
		const combinedSize = existing.byteLength + bytes.byteLength;
		if (combinedSize > this.maxAppendBytes) {
			throw new JustBashFileAllocationLimitError('appendFile', this.maxAppendBytes);
		}
		const combined = new Uint8Array(combinedSize);
		combined.set(existing);
		combined.set(bytes, existing.byteLength);
		await this.fs.writeFile(backingPath, combined, { overwrite: true, signal: this.executionSignal });
		this.mtimeOverrides.delete(normalized);
		this.remember(normalized);
		this.markWorkspaceChanged();
	}

	async exists(path: string): Promise<boolean> {
		const normalized = normalizeVirtualPath(path);
		const location = this.locate(normalized, false);
		if (!location) return false;
		if (location === 'virtual') return this.virtualFs.exists(normalized);
		if (location === 'synthetic') return true;
		return this.fs.exists(this.toBackingPath(normalized));
	}

	async stat(path: string): Promise<JustBashFsStat> {
		const normalized = normalizeVirtualPath(path);
		const location = this.locate(normalized);
		if (location === 'virtual') return this.virtualFs.stat(normalized);
		if (location === 'synthetic') return syntheticDirectoryStat();
		const stat = await this.fs.stat(this.toBackingPath(normalized), { signal: this.executionSignal });
		this.remember(normalized);
		return toJustBashStat(stat, this.mtimeOverrides.get(normalized));
	}

	async lstat(path: string): Promise<JustBashFsStat> {
		return this.stat(path);
	}

	async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
		this.assertWritable('mkdir');
		const normalized = normalizeVirtualPath(path);
		const location = this.locate(normalized);
		if (location === 'virtual') {
			this.virtualFs.mkdir(normalized, options?.recursive);
			return;
		}
		if (location === 'synthetic') {
			if (options?.recursive) return;
			throw new Error(`EEXIST: file already exists, mkdir '${path}'`);
		}
		const backingPath = this.toBackingPath(normalized);
		if (await this.fs.exists(backingPath)) {
			const stat = await this.fs.stat(backingPath, { signal: this.executionSignal });
			if (stat.kind !== 'directory' || !options?.recursive) {
				throw new Error(`EEXIST: file already exists, mkdir '${path}'`);
			}
			return;
		}
		await this.fs.mkdir(backingPath, { recursive: options?.recursive, signal: this.executionSignal });
		this.mtimeOverrides.delete(normalized);
		this.remember(normalized);
		this.markWorkspaceChanged();
	}

	async readdir(path: string): Promise<string[]> {
		return (await this.readdirWithFileTypes(path)).map((entry) => entry.name);
	}

	async readdirWithFileTypes(path: string): Promise<JustBashDirent[]> {
		return this.readDirectoryEntries(path, this.copyLimits.maxDirectoryEntries);
	}

	async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
		this.assertWritable('rm');
		const normalized = normalizeVirtualPath(path);
		const location = this.locate(normalized);
		if (location === 'virtual') {
			this.virtualFs.rm(normalized, options);
			return;
		}
		if (location === 'synthetic' || normalized === this.workspaceRoot) {
			throw new Error(`EPERM: cannot remove workspace mount '${path}'`);
		}
		await this.fs.rm(this.toBackingPath(normalized), { ...options, signal: this.executionSignal });
		this.clearMtimeOverrides(normalized);
		this.forget(normalized);
		this.markWorkspaceChanged();
	}

	async cp(src: string, dest: string, options?: { recursive?: boolean }): Promise<void> {
		this.assertWritable('cp');
		this.throwIfAborted();
		const source = normalizeVirtualPath(src);
		const destination = normalizeVirtualPath(dest);
		this.assertNonOverlapping(source, destination);
		await executeJustBashCopy({
			source,
			destination,
			recursive: options?.recursive ?? false,
			limits: this.copyLimits,
			maxReadBytes: this.maxReadBytes,
			stat: (path) => this.stat(path),
			readdir: (path, maxEntries) => this.readDirectoryEntries(path, maxEntries),
			readFile: (path, remainingBytes) =>
				readJustBashCopyFile({
					path,
					remainingBytes,
					maxReadBytes: this.maxReadBytes,
					maxCopyBytes: this.copyLimits.maxBytes,
					location: this.locate(path)!,
					toBackingPath: (value) => this.toBackingPath(value),
					fs: this.fs,
					virtualFs: this.virtualFs,
					signal: this.executionSignal,
					onBackingRead: () => this.remember(path),
					throwIfAborted: () => this.throwIfAborted(),
				}),
			exists: (path) => this.exists(path),
			mkdir: (path) => this.mkdir(path, { recursive: true }),
			writeFile: (path, content) => this.writeFile(path, content),
			throwIfAborted: () => this.throwIfAborted(),
		});
	}

	async mv(src: string, dest: string): Promise<void> {
		this.assertWritable('mv');
		const source = normalizeVirtualPath(src);
		const destination = normalizeVirtualPath(dest);
		this.assertNonOverlapping(source, destination);
		if (this.locate(source) === 'synthetic' || isProtectedVirtualSystemPath(source)) {
			throw new Error(`EPERM: cannot move protected path '${src}'`);
		}
		if (this.locate(source) === 'backing' && this.locate(destination) === 'backing') {
			await this.assertBackingParent(destination);
			await this.fs.rename(this.toBackingPath(source), this.toBackingPath(destination), {
				overwrite: true,
				signal: this.executionSignal,
			});
			const sourceMtime = this.mtimeOverrides.get(source);
			this.clearMtimeOverrides(source);
			this.clearMtimeOverrides(destination);
			if (sourceMtime !== undefined) this.mtimeOverrides.set(destination, sourceMtime);
			this.forget(source);
			this.remember(destination);
			this.markWorkspaceChanged();
			return;
		}
		await this.cp(source, destination, { recursive: true });
		await this.rm(source, { recursive: true });
	}

	getAllPaths(): string[] {
		return Array.from(new Set([...this.knownPaths, ...this.virtualFs.listPaths()])).sort();
	}

	resolvePath(base: string, path: string): string {
		return resolveVirtualPath(base || this.workspaceRoot, path);
	}

	async chmod(path: string): Promise<void> {
		this.assertWritable('chmod');
		await this.stat(path);
	}

	async symlink(): Promise<void> {
		throw new JustBashUnsupportedFileSystemOperationError('symlink');
	}

	async link(): Promise<void> {
		throw new JustBashUnsupportedFileSystemOperationError('hard link');
	}

	async readlink(): Promise<string> {
		throw new JustBashUnsupportedFileSystemOperationError('readlink');
	}

	async realpath(path: string): Promise<string> {
		const normalized = normalizeVirtualPath(path);
		await this.stat(normalized);
		return normalized;
	}

	async utimes(path: string, _atime: Date, mtime: Date): Promise<void> {
		this.assertWritable('utimes');
		const normalized = normalizeVirtualPath(path);
		const location = this.locate(normalized);
		if (location === 'virtual') {
			this.virtualFs.utimes(normalized, mtime);
			return;
		}
		if (location === 'synthetic') return;
		await this.fs.stat(this.toBackingPath(normalized), { signal: this.executionSignal });
		this.mtimeOverrides.set(normalized, mtime.getTime());
		this.markWorkspaceChanged();
	}

	private async readBackingFileBuffer(
		path: string,
		maximum: number,
		operation: string,
		reportedMaximum = maximum,
	): Promise<Uint8Array> {
		const backingPath = this.toBackingPath(path);
		const stat = await this.fs.stat(backingPath, { signal: this.executionSignal });
		if (stat.kind !== 'file') throw new Error(`EISDIR: illegal operation on a directory, open '${path}'`);
		if (!Number.isSafeInteger(stat.size) || stat.size < 0 || stat.size > maximum) {
			throw new JustBashFileAllocationLimitError(operation, reportedMaximum);
		}
		const bytes = await this.fs.readFile(backingPath, {
			encoding: 'binary',
			maxBytes: maximum + 1,
			signal: this.executionSignal,
		});
		if (bytes.byteLength > maximum) throw new JustBashFileAllocationLimitError(operation, reportedMaximum);
		this.remember(path);
		return bytes;
	}

	private locate(path: string, throwOnOutside = true): JustBashPathLocation | undefined {
		if (isVirtualSystemPath(path)) return 'virtual';
		if (isPathWithin(this.workspaceRoot, path)) return 'backing';
		if (this.mountAncestors.includes(path)) return 'synthetic';
		if (throwOnOutside) throw new Error(`Path is outside workspace ${this.workspaceRoot}: ${path}`);
		return undefined;
	}

	private toBackingPath(path: string): string {
		return mapWorkspacePath(path, this.workspaceRoot, this.fsRoot);
	}

	private assertBackingLocation(path: string): void {
		if (this.locate(path) !== 'backing') throw new Error(`Path is not writable backing storage: ${path}`);
	}

	private async assertBackingParent(path: string): Promise<void> {
		const parent = parentVirtualPath(path);
		const stat = await this.stat(parent);
		if (!stat.isDirectory) throw new Error(`ENOTDIR: not a directory, open '${path}'`);
	}

	private assertWritable(operation: string): void {
		if (this.readOnly) throw new JustBashReadOnlyFileSystemError(operation);
	}

	private assertNonOverlapping(source: string, destination: string): void {
		if (source === destination || isPathWithin(source, destination) || isPathWithin(destination, source)) {
			throw new Error(`Source and destination paths must not overlap: ${source}, ${destination}`);
		}
	}

	private async readDirectoryEntries(path: string, maxEntries: number): Promise<JustBashDirent[]> {
		this.throwIfAborted();
		const normalized = normalizeVirtualPath(path);
		const location = this.locate(normalized);
		if (location === 'virtual') return this.virtualFs.readdir(normalized, maxEntries);
		if (location === 'synthetic') return this.readSyntheticDirectory(normalized, maxEntries);
		const stats = await this.fs.readdir(this.toBackingPath(normalized), {
			maxEntries,
			signal: this.executionSignal,
		});
		this.throwIfAborted();
		assertReaddirEntryLimit(stats.length, maxEntries, normalized);
		const entries = stats.map((stat) => toJustBashDirent(stat));
		for (const entry of entries) this.remember(childVirtualPath(normalized, entry.name));
		const merged =
			normalized === '/' && this.workspaceRoot === '/'
				? mergeDirents(entries, this.virtualFs.readdir('/', maxEntries))
				: entries;
		assertReaddirEntryLimit(merged.length, maxEntries, normalized);
		return merged;
	}

	private readSyntheticDirectory(path: string, maxEntries: number): JustBashDirent[] {
		const entries: JustBashDirent[] = path === '/' ? this.virtualFs.readdir('/', maxEntries) : [];
		const child = this.mountAncestors.find((candidate) => candidate !== path && parentVirtualPath(candidate) === path);
		if (child) entries.push(directoryDirent(virtualBasename(child)));
		const merged = mergeDirents(entries);
		assertReaddirEntryLimit(merged.length, maxEntries, path);
		return merged;
	}

	private remember(path: string): void {
		this.knownPaths.add(path);
	}

	private forget(path: string): void {
		for (const known of this.knownPaths) if (isPathWithin(path, known)) this.knownPaths.delete(known);
	}

	private clearMtimeOverrides(path: string): void {
		for (const known of this.mtimeOverrides.keys()) {
			if (isPathWithin(path, known)) this.mtimeOverrides.delete(known);
		}
	}

	private throwIfAborted(): void {
		if (!this.executionSignal?.aborted) return;
		throw this.executionSignal.reason ?? new DOMException('Operation aborted', 'AbortError');
	}

	private markWorkspaceChanged(): void {
		this.onWorkspaceChanged?.();
	}
}
