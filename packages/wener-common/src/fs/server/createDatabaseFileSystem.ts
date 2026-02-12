import * as crypto from 'node:crypto';
import { basename, dirname, join, normalize } from 'node:path';
import { BaseEntity, Cascade, Collection, type Opt, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import type { EntityManager } from '@mikro-orm/sql';
import type { CopyOptions } from 'fs-extra';
import { FileSystemError, FileSystemErrorCode } from '../FileSystemError';
import type {
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	IFileStat,
	IFileSystem,
	MkdirOptions,
	ReaddirOptions,
	ReadFileOptions,
	RenameOptions,
	RmOptions,
	StatOptions,
	WriteFileOptions,
} from '../IFileSystem';
import { FileKind } from '../types';

export function createDatabaseFileSystem(options: Partial<IDatabaseFileSystemOptions> = {}): IDatabaseFileSystem {
	return new DBFS(options);
}

type IDatabaseFileSystem = IFileSystem & {
	ensureRootNode(): Promise<FileNodeMetaEntity>;
};
type IDatabaseFileSystemOptions = {
	getEntityManager: () => EntityManager;
	smallFileThreshold?: number;
};

class DBFS implements IFileSystem {
	options: IDatabaseFileSystemOptions;

	constructor(options: Partial<IDatabaseFileSystemOptions> = {}) {
		if (!options.getEntityManager) {
			throw new Error('getEntityManager is required for DBFS');
		}
		this.options = {
			smallFileThreshold: 512,
			...options,
		} as IDatabaseFileSystemOptions;
	}

	get em() {
		return this.options.getEntityManager();
	}

	/**
	 * Ensure root node exists, create it if it doesn't exist
	 * @returns The root FileNodeMetaEntity
	 */
	async ensureRootNode(): Promise<FileNodeMetaEntity> {
		const em = this.em;
		const rootQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
		rootQb.where({ parent: null });
		const rootNode = await rootQb.getSingleResult();

		if (rootNode) {
			return rootNode;
		}

		// Create root directory (parent is null, filename is empty string)
		const now = new Date();
		const rootDir = em.create(FileNodeMetaEntity, {
			filename: '',
			parent: null,
			kind: FileKind.directory,
			size: 0,
			atime: now,
			btime: now,
			ctime: now,
			mtime: now,
		});
		try {
			await em.persist(rootDir).flush();
			return rootDir;
		} catch (error: any) {
			// If root already exists (race condition), fetch and return it
			if (error.message?.includes('UNIQUE constraint') || error.message?.includes('duplicate')) {
				const existingRootQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
				existingRootQb.where({ parent: null });
				const existingRoot = await existingRootQb.getSingleResult();
				if (existingRoot) {
					return existingRoot;
				}
			}
			throw error;
		}
	}

	async stat(path: string, options?: StatOptions): Promise<IFileStat> {
		// Validate input
		if (!path || typeof path !== 'string') {
			throw new FileSystemError('Invalid path', FileSystemErrorCode.EINVAL);
		}

		const em = this.em;
		const node = await this._getNodeByPath(path, em);
		if (!node) {
			throw new FileSystemError(`Path not found: ${path}`, FileSystemErrorCode.ENOENT);
		}
		return this._toFileStat(node, path);
	}

	async exists(path: string): Promise<boolean> {
		return !!(await this._getNodeByPath(path, this.em));
	}

	async readdir(dir: string, options?: ReaddirOptions): Promise<IFileStat[]> {
		const em = this.em;
		const parentNode = await this._getNodeByPath(dir, em);

		if (!parentNode) {
			throw new FileSystemError(`Directory not found: ${dir}`, FileSystemErrorCode.ENOENT);
		}
		if (parentNode.kind !== FileKind.directory) {
			throw new FileSystemError(`Path is not a directory: ${dir}`, FileSystemErrorCode.ENOTDIR);
		}

		// Use QueryBuilder to avoid automatic relationship loading
		const qb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
		qb.where({ parent: parentNode });
		const children = await qb.getResult();

		return children.map((child) => this._toFileStat(child, join(dir, child.filename)));
	}

	async mkdir(path: string, options: MkdirOptions = {}): Promise<void> {
		await this._mkdirInTransaction(path, options, this.em);
	}

	private async _mkdirInTransaction(path: string, options: MkdirOptions, em: EntityManager): Promise<void> {
		const normalized = normalize(path);

		// Special handling for root directory
		if (normalized === '/') {
			const rootQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
			rootQb.where({ parent: null });
			const rootNode = await rootQb.getSingleResult();
			if (rootNode) {
				// Root directory already exists
				return;
			}
			// Create root directory (parent is null, filename is empty string)
			const now = new Date();
			const rootDir = em.create(FileNodeMetaEntity, {
				filename: '',
				parent: null,
				kind: FileKind.directory,
				size: 0,
				atime: now,
				btime: now,
				ctime: now,
				mtime: now,
			});
			try {
				await em.persist(rootDir).flush();
			} catch (error: any) {
				// If root already exists (race condition), ignore the error
				if (!error.message?.includes('UNIQUE constraint') && !error.message?.includes('duplicate')) {
					throw error;
				}
			}
			return;
		}

		const parentPath = dirname(normalized);
		const newDirName = basename(normalized);

		if (!newDirName) throw new FileSystemError('Cannot create directory with empty name', FileSystemErrorCode.EINVAL);

		let parentNode = await this._getNodeByPath(parentPath, em);

		if (!parentNode) {
			if (options.recursive) {
				await this._mkdirInTransaction(parentPath, options, em);
				parentNode = await this._getNodeByPath(parentPath, em);
			} else {
				throw new FileSystemError(`Parent directory not found: ${parentPath}`, FileSystemErrorCode.ENOENT);
			}
		}

		if (!parentNode)
			throw new FileSystemError('Failed to create parent directory structure', FileSystemErrorCode.EINVAL);

		// Check if directory already exists using QueryBuilder
		const existingQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
		existingQb.where({ parent: parentNode, filename: newDirName });
		const existing = await existingQb.getSingleResult();

		if (existing) {
			if (existing.kind === FileKind.directory) {
				return;
			}
			throw new FileSystemError(`A file with the same name already exists: ${path}`, FileSystemErrorCode.EEXIST);
		}

		const now = new Date();
		const newDir = em.create(FileNodeMetaEntity, {
			tid: parentNode.tid,
			parent: parentNode,
			filename: newDirName,
			kind: FileKind.directory,
			size: 0,
			atime: now,
			btime: now,
			ctime: now,
			mtime: now,
		});
		await em.persist(newDir).flush();
	}

	readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;

	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;

	async readFile(
		path: string,
		options?: ReadFileOptions & {
			encoding?: 'text' | 'binary' | string;
		},
	): Promise<string | Uint8Array> {
		const em = this.em;
		const node = await this._getNodeByPath(path, em);

		if (!node) throw new FileSystemError(`File not found: ${path}`, FileSystemErrorCode.ENOENT);
		if (node.kind !== FileKind.file)
			throw new FileSystemError(`Path is not a file: ${path}`, FileSystemErrorCode.EISDIR);

		let data: Buffer | Uint8Array;
		if (node.content) {
			data = node.content;
		} else {
			const fileContentQb = em.createQueryBuilder(FileNodeContentEntity, 'fc');
			fileContentQb.where({ node: node });
			const fileContent = await fileContentQb.getSingleResult();
			if (!fileContent) throw new FileSystemError('File content is missing', FileSystemErrorCode.ENOENT);
			data = fileContent.content;
		}

		const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
		return options?.encoding === 'text' ? buf.toString('utf-8') : buf;
	}

	async writeFile(path: string, data: string | Buffer, options: WriteFileOptions = {}): Promise<void> {
		if (!path || typeof path !== 'string') {
			throw new FileSystemError('Invalid path', FileSystemErrorCode.EINVAL);
		}
		if (data === null || data === undefined) {
			throw new FileSystemError('Invalid data', FileSystemErrorCode.EINVAL);
		}

		await this.em.transactional(async (em) => {
			const { overwrite = true } = options;
			const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
			const size = bufferData.length;

			const parentPath = dirname(path);
			const filename = basename(path);

			if (!filename) {
				throw new FileSystemError('filename cannot be empty', FileSystemErrorCode.EINVAL);
			}

			await this._mkdirInTransaction(parentPath, { recursive: true }, em);
			const parentNode = await this._getNodeByPath(parentPath, em);
			if (!parentNode) throw new FileSystemError('Failed to establish parent directory', FileSystemErrorCode.EINVAL);

			const nodeQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
			nodeQb.where({ parent: parentNode, filename });
			let node = await nodeQb.getSingleResult();

			if (node) {
				if (!overwrite) throw new FileSystemError(`File already exists: ${path}`, FileSystemErrorCode.EEXIST);
				if (node.kind === FileKind.directory)
					throw new FileSystemError(`Cannot overwrite a directory with a file: ${path}`, FileSystemErrorCode.EISDIR);

				node.size = size;
				node.mtime = new Date();
			} else {
				const now = new Date();
				node = em.create(FileNodeMetaEntity, {
					tid: parentNode.tid,
					filename,
					parent: parentNode,
					kind: FileKind.file,
					size,
					atime: now,
					btime: now,
					ctime: now,
					mtime: now,
				});
			}

			if (size <= this.options.smallFileThreshold!) {
				node.content = bufferData;
				const existingContentQb = em.createQueryBuilder(FileNodeContentEntity, 'fc');
				existingContentQb.where({ node: node });
				const existingContent = await existingContentQb.getSingleResult();
				if (existingContent) {
					await em.remove(existingContent).flush();
				}
			} else {
				node.content = undefined;
				const md5 = crypto.createHash('md5').update(bufferData).digest('hex');
				const sha256 = crypto.createHash('sha256').update(bufferData).digest('hex');

				const fileContentQb = em.createQueryBuilder(FileNodeContentEntity, 'fc');
				fileContentQb.where({ node: node });
				let fileContent = await fileContentQb.getSingleResult();

				if (fileContent) {
					fileContent.content = bufferData;
					fileContent.size = size;
					fileContent.md5 = md5;
					fileContent.sha256 = sha256;
				} else {
					fileContent = em.create(FileNodeContentEntity, {
						node: node,
						tid: node.tid,
						content: bufferData,
						size: size,
						md5: md5,
						sha256: sha256,
					} as any);
				}
			}

			await em.persist(node).flush();
		});
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		await this.em.transactional(async (em) => {
			const node = await this._getNodeByPath(path, em);
			if (!node) {
				if (options.force) return;
				throw new FileSystemError(`Path not found: ${path}`, FileSystemErrorCode.ENOENT);
			}

			if (node.kind === FileKind.directory && !options.recursive) {
				const childrenQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
				childrenQb.where({ parent: node });
				childrenQb.select('id');
				const children = await childrenQb.getResult();
				if (children.length > 0) {
					throw new FileSystemError(`Directory not empty: ${path}`, FileSystemErrorCode.ENOTEMPTY);
				}
			}

			await em.remove(node).flush();
		});
	}

	async rename(oldPath: string, newPath: string, options: RenameOptions = {}): Promise<void> {
		await this.em.transactional(async (em) => {
			const node = await this._getNodeByPath(oldPath, em);
			if (!node) throw new FileSystemError(`Source path not found: ${oldPath}`, FileSystemErrorCode.ENOENT);

			const newParentPath = dirname(newPath);
			const newFilename = basename(newPath);

			const newParentNode = await this._getNodeByPath(newParentPath, em);
			if (!newParentNode)
				throw new FileSystemError(`Destination directory not found: ${newParentPath}`, FileSystemErrorCode.ENOENT);

			const existingDestQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
			existingDestQb.where({ parent: newParentNode, filename: newFilename });
			const existingDest = await existingDestQb.getSingleResult();
			if (existingDest) {
				if (!options.overwrite)
					throw new FileSystemError(`Destination path already exists: ${newPath}`, FileSystemErrorCode.EEXIST);
				if (node.id === existingDest.id) return;
				await em.remove(existingDest).flush();
			}

			node.parent = newParentNode;
			node.filename = newFilename;
			node.mtime = new Date();

			await em.flush();
		});
	}

	async copy(srcPath: string, destPath: string, options: CopyOptions = {}): Promise<void> {
		await this.em.transactional(async (em) => {
			const srcNode = await this._getNodeByPath(srcPath, em);
			if (!srcNode) throw new FileSystemError(`Source path not found: ${srcPath}`, FileSystemErrorCode.ENOENT);

			const destParentPath = dirname(destPath);
			const destFilename = basename(destPath);

			const destParentNode = await this._getNodeByPath(destParentPath, em);
			if (!destParentNode)
				throw new FileSystemError(`Destination directory not found: ${destParentPath}`, FileSystemErrorCode.ENOENT);

			const existingDestQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
			existingDestQb.where({ parent: destParentNode, filename: destFilename });
			const existingDest = await existingDestQb.getSingleResult();
			if (existingDest) {
				if (!options.overwrite)
					throw new FileSystemError(`Destination path already exists: ${destPath}`, FileSystemErrorCode.EEXIST);
				await em.remove(existingDest).flush();
			}

			await this._copyNode(srcNode, destParentNode, destFilename, em);
		});
	}

	createReadStream(path: string, options?: CreateReadStreamOptions): never {
		throw new Error('Streaming read is not supported by DBFS yet.');
	}

	createWriteStream(path: string, options?: CreateWriteStreamOptions): never {
		throw new Error('Streaming write is not supported by DBFS yet.');
	}

	createReadableStream(path: string, options?: CreateReadStreamOptions): ReadableStream {
		throw new Error('ReadableStream is not supported by DBFS yet.');
	}

	createWritableStream(path: string, options?: CreateWriteStreamOptions): WritableStream {
		throw new Error('WritableStream is not supported by DBFS yet.');
	}

	private async _getNodeByPath(pathStr: string, em: EntityManager): Promise<FileNodeMetaEntity | null> {
		const normalized = normalize(pathStr);

		if (normalized === '/') {
			const qb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
			qb.where({ parent: null });
			const rootNode = await qb.getSingleResult();
			return rootNode || null;
		}

		const parts = normalized.split('/').filter((p) => p);

		const rootQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
		rootQb.where({ parent: null });
		let currentNode = await rootQb.getSingleResult();
		if (!currentNode) return null;

		for (const part of parts) {
			const childQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
			childQb.where({ parent: currentNode, filename: part });
			const child = await childQb.getSingleResult();
			if (!child) return null;
			currentNode = child;
		}

		return currentNode;
	}

	private _toFileStat(node: FileNodeMetaEntity, path: string): IFileStat {
		let mtime: number;
		if (node.mtime instanceof Date) {
			mtime = node.mtime.getTime();
		} else if (typeof node.mtime === 'string') {
			mtime = new Date(node.mtime).getTime();
		} else {
			mtime = Date.now();
		}

		let size: number;
		if (typeof node.size === 'bigint') {
			size = Number(node.size);
		} else {
			size = node.size;
		}

		return {
			path: path,
			name: node.filename,
			kind: node.kind,
			size: size,
			mtime: mtime,
			meta: node.metadata || {},
			directory: dirname(path),
		};
	}

	private async _copyNode(
		srcNode: FileNodeMetaEntity,
		destParent: FileNodeMetaEntity,
		newName: string,
		em: EntityManager,
	): Promise<void> {
		const now = new Date();
		const copiedContent = srcNode.content ? Buffer.from(srcNode.content) : undefined;
		const newNode = em.create(FileNodeMetaEntity, {
			tid: srcNode.tid,
			filename: newName,
			parent: destParent,
			kind: srcNode.kind,
			size: srcNode.size,
			metadata: srcNode.metadata ? { ...srcNode.metadata } : undefined,
			content: copiedContent,
			atime: now,
			btime: now,
			ctime: now,
			mtime: now,
		});

		if (!srcNode.content) {
			const srcFileContentQb = em.createQueryBuilder(FileNodeContentEntity, 'fc');
			srcFileContentQb.where({ node: srcNode });
			const srcFileContent = await srcFileContentQb.getSingleResult();
			if (srcFileContent) {
				em.create(FileNodeContentEntity, {
					node: newNode,
					tid: srcNode.tid,
					content: srcFileContent.content ? Buffer.from(srcFileContent.content) : srcFileContent.content,
					size: srcFileContent.size,
					md5: srcFileContent.md5,
					sha256: srcFileContent.sha256,
					mimeType: srcFileContent.mimeType,
					metadata: srcFileContent.metadata ? { ...srcFileContent.metadata } : undefined,
				} as any);
			}
		}

		await em.persist(newNode).flush();

		if (srcNode.kind === FileKind.directory) {
			const childrenQb = em.createQueryBuilder(FileNodeMetaEntity, 'f');
			childrenQb.where({ parent: srcNode });
			const children = await childrenQb.getResult();
			for (const child of children) {
				await this._copyNode(child, newNode, child.filename, em);
			}
		}
	}
}

@Entity({ tableName: 'file_node_meta' })
@Unique({ properties: ['tid', 'parent', 'filename'] })
export class FileNodeMetaEntity extends BaseEntity {
	@PrimaryKey({ type: 'text', onCreate: () => crypto.randomUUID() })
	id!: string & Opt;

	@Property({ type: 'text', nullable: true })
	tid?: string;

	@Property({ type: 'text', nullable: false })
	filename!: string;

	@Property({ type: 'integer', nullable: false, default: 0 })
	size!: number & Opt;

	@Property({ type: 'text', nullable: false })
	kind!: FileKind;

	@Property({ type: 'text', nullable: false })
	atime!: Date & Opt;

	@Property({ type: 'text', nullable: false })
	btime!: Date & Opt;

	@Property({ type: 'text', nullable: false })
	ctime!: Date & Opt;

	@Property({ type: 'text', nullable: false })
	mtime!: Date & Opt;

	@Property({ type: 'json', nullable: false, default: '{}' })
	metadata!: Record<string, any> & Opt;

	@ManyToOne(() => FileNodeMetaEntity, { nullable: true, cascade: [] })
	parent?: Rel<FileNodeMetaEntity>;

	@OneToMany({ entity: () => FileNodeMetaEntity, mappedBy: 'parent', orphanRemoval: true })
	children = new Collection<FileNodeMetaEntity>(this);

	@OneToOne({
		entity: () => FileNodeContentEntity,
		mappedBy: 'node',
		orphanRemoval: true,
		nullable: true,
		cascade: [Cascade.ALL],
	})
	fileContent?: Rel<FileNodeContentEntity>;

	@Property({ type: 'blob', nullable: true })
	content?: Buffer;

	get parentId() {
		return this.parent?.id as Opt<string | undefined>;
	}
}

@Entity({ tableName: 'file_node_content' })
export class FileNodeContentEntity extends BaseEntity {
	@PrimaryKey({ type: 'text', onCreate: () => crypto.randomUUID() })
	id!: string & Opt;

	@Property({ type: 'text', nullable: true })
	tid?: string;

	@OneToOne({ entity: () => FileNodeMetaEntity, owner: true, joinColumn: 'node_id' })
	node!: Rel<FileNodeMetaEntity>;

	@Property({ type: 'integer', nullable: false })
	size!: number;

	@Property({ type: 'blob', lazy: true })
	content!: Buffer;

	@Property({ type: 'text', nullable: true })
	mimeType?: string;

	@Property({ type: 'text', nullable: true })
	md5?: string;

	@Property({ type: 'text', nullable: true })
	sha256?: string;

	@Property({ type: 'text', nullable: true })
	text?: string;

	@Property({ type: 'integer', nullable: true })
	width?: number;

	@Property({ type: 'integer', nullable: true })
	height?: number;

	@Property({ type: 'json', nullable: false, default: '{}' })
	metadata!: Record<string, any> & Opt;
}
