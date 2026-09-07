import type { FsStat } from 'just-bash';
import { assertReaddirEntryLimit, validateReaddirMaxEntries } from '../readdirLimit';
import { concatBytes } from './encoding';
import {
	childVirtualPath,
	isPathWithin,
	isProtectedVirtualSystemPath,
	normalizeVirtualPath,
	parentVirtualPath,
	virtualBasename,
} from './paths';

export type JustBashDirent = {
	name: string;
	isFile: boolean;
	isDirectory: boolean;
	isSymbolicLink: false;
};

type VirtualDirectory = { kind: 'directory'; mtime: number };
type VirtualFile = { kind: 'file'; content: Uint8Array; mtime: number };
type VirtualNode = VirtualDirectory | VirtualFile;

export class JustBashVirtualFileSystem {
	private readonly nodes = new Map<string, VirtualNode>();

	constructor() {
		const now = Date.now();
		for (const path of ['/', '/tmp', '/dev', '/home', '/home/user']) {
			this.nodes.set(path, { kind: 'directory', mtime: now });
		}
		this.nodes.set('/dev/null', { kind: 'file', content: new Uint8Array(), mtime: now });
		this.nodes.set('/dev/stdin', { kind: 'file', content: new Uint8Array(), mtime: now });
	}

	listPaths(): string[] {
		return Array.from(this.nodes.keys()).sort();
	}

	setStdin(content: Uint8Array): void {
		this.nodes.set('/dev/stdin', { kind: 'file', content: content.slice(), mtime: Date.now() });
	}

	clearStdin(): void {
		this.setStdin(new Uint8Array());
	}

	exists(path: string): boolean {
		return this.nodes.has(normalizeVirtualPath(path));
	}

	stat(path: string): FsStat {
		const normalized = normalizeVirtualPath(path);
		const node = this.getNode(normalized);
		return {
			isFile: node.kind === 'file',
			isDirectory: node.kind === 'directory',
			isSymbolicLink: false,
			mode: node.kind === 'directory' ? 0o755 : 0o644,
			size: node.kind === 'file' ? node.content.byteLength : 0,
			mtime: new Date(node.mtime),
		};
	}

	readFile(path: string): Uint8Array {
		const node = this.getNode(normalizeVirtualPath(path));
		if (node.kind !== 'file') throw new Error(`EISDIR: illegal operation on a directory, open '${path}'`);
		return node.content.slice();
	}

	writeFile(path: string, content: Uint8Array): void {
		const normalized = normalizeVirtualPath(path);
		if (normalized === '/dev/null') return;
		this.assertParentDirectory(normalized);
		const existing = this.nodes.get(normalized);
		if (existing?.kind === 'directory') throw new Error(`EISDIR: illegal operation on a directory, open '${path}'`);
		this.nodes.set(normalized, { kind: 'file', content: content.slice(), mtime: Date.now() });
	}

	appendFile(path: string, content: Uint8Array): void {
		const normalized = normalizeVirtualPath(path);
		if (normalized === '/dev/null') return;
		const existing = this.nodes.get(normalized);
		if (!existing) {
			this.writeFile(normalized, content);
			return;
		}
		if (existing.kind !== 'file') throw new Error(`EISDIR: illegal operation on a directory, open '${path}'`);
		existing.content = concatBytes(existing.content, content);
		existing.mtime = Date.now();
	}

	mkdir(path: string, recursive = false): void {
		const normalized = normalizeVirtualPath(path);
		const existing = this.nodes.get(normalized);
		if (existing) {
			if (existing.kind === 'file') throw new Error(`EEXIST: file already exists, mkdir '${path}'`);
			if (!recursive) throw new Error(`EEXIST: file already exists, mkdir '${path}'`);
			return;
		}
		if (recursive) {
			this.mkdirRecursive(normalized);
			return;
		}
		this.assertParentDirectory(normalized);
		this.nodes.set(normalized, { kind: 'directory', mtime: Date.now() });
	}

	readdir(path: string, requestedMaxEntries?: number): JustBashDirent[] {
		const normalized = normalizeVirtualPath(path);
		const maxEntries = validateReaddirMaxEntries(requestedMaxEntries);
		const node = this.getNode(normalized);
		if (node.kind !== 'directory') throw new Error(`ENOTDIR: not a directory, scandir '${path}'`);
		const entries = new Map<string, JustBashDirent>();
		for (const [candidate, child] of this.nodes) {
			if (candidate === normalized || parentVirtualPath(candidate) !== normalized) continue;
			assertReaddirEntryLimit(entries.size + 1, maxEntries, normalized);
			entries.set(virtualBasename(candidate), {
				name: virtualBasename(candidate),
				isFile: child.kind === 'file',
				isDirectory: child.kind === 'directory',
				isSymbolicLink: false,
			});
		}
		return Array.from(entries.values()).sort((left, right) => left.name.localeCompare(right.name));
	}

	rm(path: string, options: { recursive?: boolean; force?: boolean } = {}): void {
		const normalized = normalizeVirtualPath(path);
		if (isProtectedVirtualSystemPath(normalized)) {
			throw new Error(`EPERM: operation not permitted, rm '${path}'`);
		}
		const node = this.nodes.get(normalized);
		if (!node) {
			if (options.force) return;
			throw new Error(`ENOENT: no such file or directory, rm '${path}'`);
		}
		const descendants = this.listDescendants(normalized);
		if (node.kind === 'directory' && descendants.length > 0 && !options.recursive) {
			throw new Error(`ENOTEMPTY: directory not empty, rm '${path}'`);
		}
		for (const descendant of descendants) this.nodes.delete(descendant);
		this.nodes.delete(normalized);
	}

	utimes(path: string, mtime: Date): void {
		const normalized = normalizeVirtualPath(path);
		const node = this.getNode(normalized);
		node.mtime = mtime.getTime();
	}

	private getNode(path: string): VirtualNode {
		const node = this.nodes.get(path);
		if (!node) throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
		return node;
	}

	private assertParentDirectory(path: string): void {
		const parent = this.nodes.get(parentVirtualPath(path));
		if (!parent) throw new Error(`ENOENT: no such file or directory, open '${path}'`);
		if (parent.kind !== 'directory') throw new Error(`ENOTDIR: not a directory, open '${path}'`);
	}

	private mkdirRecursive(path: string): void {
		let current = '/';
		for (const part of path.split('/').filter(Boolean)) {
			current = childVirtualPath(current, part);
			const existing = this.nodes.get(current);
			if (existing?.kind === 'file') throw new Error(`ENOTDIR: not a directory, mkdir '${path}'`);
			if (!existing) this.nodes.set(current, { kind: 'directory', mtime: Date.now() });
		}
	}

	private listDescendants(path: string): string[] {
		return Array.from(this.nodes.keys())
			.filter((candidate) => candidate !== path && isPathWithin(path, candidate))
			.sort((left, right) => right.length - left.length);
	}
}
