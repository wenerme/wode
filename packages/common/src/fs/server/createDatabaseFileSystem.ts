import * as crypto from 'node:crypto';
import { basename, dirname, join, normalize } from 'node:path';
import {
	Cascade,
	Collection,
	Entity,
	Enum,
	ManyToOne,
	OneToMany,
	OneToOne,
	Property,
	types,
	Unique,
	type Opt,
	type Rel,
} from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TenantBaseEntity } from '@wener/nestjs/entity';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import type { CopyOptions } from 'fs-extra';
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

enum FileKind {
	DIRECTORY = 'directory',
	FILE = 'file',
}

export function createDatabaseFileSystem(options: Partial<IDatabaseFileSystemOptions> = {}): IDatabaseFileSystem {
	return new DBFS(options);
}

type IDatabaseFileSystem = IFileSystem & {};
type IDatabaseFileSystemOptions = {
	getEntityManager: () => EntityManager;
	smallFileThreshold?: number;
};

class DBFS implements IFileSystem {
	options: IDatabaseFileSystemOptions;

	constructor(options: Partial<IDatabaseFileSystemOptions> = {}) {
		this.options = {
			getEntityManager: () => getEntityManager<EntityManager>().fork(),
			smallFileThreshold: 64 * 1024,
			...options,
		};
	}

	get em() {
		return this.options.getEntityManager();
	}

	async stat(path: string, options?: StatOptions): Promise<IFileStat> {
		const em = this.em;
		const node = await this._getNodeByPath(path, em);
		if (!node) {
			throw new FileSystemError(`Path not found: ${path}`, 'ENOENT');
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
			throw new FileSystemError(`Directory not found: ${dir}`, 'ENOENT');
		}
		if (parentNode.kind !== FileKind.DIRECTORY) {
			throw new FileSystemError(`Path is not a directory: ${dir}`, 'ENOTDIR');
		}

		await em.populate(parentNode, ['children']);

		return (await parentNode.children.loadItems()).map((child) => this._toFileStat(child, join(dir, child.filename)));
	}

	async mkdir(path: string, options: MkdirOptions = {}): Promise<void> {
		const em = this.em;
		const normalized = normalize(path);
		const parentPath = dirname(normalized);
		const newDirName = basename(normalized);

		if (!newDirName) throw new FileSystemError('Cannot create directory with empty name');

		let parentNode = await this._getNodeByPath(parentPath, em);

		if (!parentNode) {
			if (options.recursive) {
				// 递归创建父目录
				await this.mkdir(parentPath, options);
				parentNode = await this._getNodeByPath(parentPath, em);
			} else {
				throw new FileSystemError(`Parent directory not found: ${parentPath}`, 'ENOENT');
			}
		}

		if (!parentNode) throw new FileSystemError('Failed to create parent directory structure');

		// const existing = await em.findOne(FileNodeMetaEntity, { parent: parentNode, filename: newDirName });
		//
		// if (existing) {
		//   if (existing.kind === FileKind.DIRECTORY) return; // 目录已存在，静默处理
		//   throw new FileSystemError(`A file with the same name already exists: ${path}`, 'EEXIST');
		// }

		const newDir = await em.upsert(
			FileNodeMetaEntity,
			{
				tid: parentNode.tid,
				parent: parentNode,
				filename: newDirName,
				kind: FileKind.DIRECTORY,
				size: 0,
			},
			{
				onConflictAction: 'ignore',
				onConflictFields: ['tid', 'parent', 'filename'],
			},
		);

		if (newDir.kind !== FileKind.DIRECTORY) {
			throw new FileSystemError(`A file with the same name already exists: ${path}`, 'EEXIST');
		}

		// await em.persistAndFlush(newDir);
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

		if (!node) throw new FileSystemError(`File not found: ${path}`, 'ENOENT');
		if (node.kind !== FileKind.FILE) throw new FileSystemError(`Path is not a file: ${path}`, 'EISDIR');

		let buffer: Buffer;
		if (node.content) {
			// 小文件优化
			buffer = node.content;
		} else {
			await em.populate(node, ['fileContent.content']);
			if (!node.fileContent) throw new FileSystemError('File content is missing', 'ECONTENT');
			buffer = node.fileContent.content;
		}

		return options?.encoding === 'text' ? buffer.toString('utf-8') : buffer;
	}

	async writeFile(path: string, data: string | Buffer, options: WriteFileOptions = {}): Promise<void> {
		await this.em.transactional(async (em) => {
			const { overwrite = true } = options;
			const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
			const size = bufferData.length;

			const parentPath = dirname(path);
			const filename = basename(path);

			// 确保父目录存在
			await this.mkdir(parentPath, { recursive: true });
			const parentNode = await this._getNodeByPath(parentPath, em);
			if (!parentNode) throw new FileSystemError('Failed to establish parent directory');

			let node = await em.findOne(FileNodeMetaEntity, { parent: parentNode, filename });

			if (node) {
				// 文件已存在
				if (!overwrite) throw new FileSystemError(`File already exists: ${path}`, 'EEXIST');
				if (node.kind === FileKind.DIRECTORY)
					throw new FileSystemError(`Cannot overwrite a directory with a file: ${path}`, 'EISDIR');

				// 更新节点
				node.size = size;
				node.mtime = new Date();
				// ... 其他时间戳
			} else {
				// 新建文件
				node = em.create(FileNodeMetaEntity, {
					tid: parentNode.tid,
					filename,
					parent: parentNode,
					kind: FileKind.FILE,
					size,
				});
			}

			// 处理文件内容
			if (size <= this.options.smallFileThreshold!) {
				node.content = bufferData;
				// 如果之前有大文件内容，需要删除
				if (node.fileContent) {
					em.remove(node.fileContent);
					node.fileContent = undefined;
				}
			} else {
				node.content = undefined; // 清除小文件内容
				const md5 = crypto.createHash('md5').update(bufferData).digest('hex');
				const sha256 = crypto.createHash('sha256').update(bufferData).digest('hex');

				if (node.fileContent) {
					node.fileContent.content = bufferData;
					node.fileContent.md5 = md5;
					node.fileContent.sha256 = sha256;
				} else {
					const contentEntity = em.create(FileNodeContentEntity, {
						tid: node.tid,
						node,
						content: bufferData,
						size: bufferData.length,
						md5,
						sha256,
					});
					node.fileContent = contentEntity;
				}
			}

			await em.persistAndFlush(node);
		});
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		await this.em.transactional(async (em) => {
			const node = await this._getNodeByPath(path, em);
			if (!node) {
				if (options.force) return; // force=true, 不存在也算成功
				throw new FileSystemError(`Path not found: ${path}`, 'ENOENT');
			}

			if (node.kind === FileKind.DIRECTORY && !options.recursive) {
				await em.populate(node, ['children']);
				if (node.children.length > 0) {
					throw new FileSystemError(`Directory not empty: ${path}`, 'ENOTEMPTY');
				}
			}

			// 使用 orphanRemoval: true, ORM会自动处理子节点和内容的删除
			await em.removeAndFlush(node);
		});
	}

	async rename(oldPath: string, newPath: string, options: RenameOptions = {}): Promise<void> {
		await this.em.transactional(async (em) => {
			const node = await this._getNodeByPath(oldPath, em);
			if (!node) throw new FileSystemError(`Source path not found: ${oldPath}`, 'ENOENT');

			const newParentPath = dirname(newPath);
			const newFilename = basename(newPath);

			const newParentNode = await this._getNodeByPath(newParentPath, em);
			if (!newParentNode) throw new FileSystemError(`Destination directory not found: ${newParentPath}`, 'ENOENT');

			const existingDest = await em.findOne(FileNodeMetaEntity, { parent: newParentNode, filename: newFilename });
			if (existingDest) {
				if (!options.overwrite) throw new FileSystemError(`Destination path already exists: ${newPath}`, 'EEXIST');
				if (node.id === existingDest.id) return; // 移动到原位置，什么都不做
				await em.removeAndFlush(existingDest);
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
			if (!srcNode) throw new FileSystemError(`Source path not found: ${srcPath}`, 'ENOENT');

			const destParentPath = dirname(destPath);
			const destFilename = basename(destPath);

			const destParentNode = await this._getNodeByPath(destParentPath, em);
			if (!destParentNode) throw new FileSystemError(`Destination directory not found: ${destParentPath}`, 'ENOENT');

			const existingDest = await em.findOne(FileNodeMetaEntity, { parent: destParentNode, filename: destFilename });
			if (existingDest) {
				if (!options.overwrite) throw new FileSystemError(`Destination path already exists: ${destPath}`, 'EEXIST');
				await this.rm(destPath, { recursive: true, force: true });
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

	/**
	 * 将路径字符串解析为数据库中的节点。这是大部分操作的基础。
	 * @param pathStr 绝对路径, e.g., /home/user/file.txt
	 * @param em EntityManager 实例
	 * @returns 找到的节点或 null
	 */
	private async _getNodeByPath(pathStr: string, em: EntityManager): Promise<FileNodeMetaEntity | null> {
		const normalized = normalize(pathStr);
		if (normalized === '/') {
			return em.findOne(FileNodeMetaEntity, { parent: null });
		}

		const parts = normalized.split('/').filter((p) => p);
		let currentNode: FileNodeMetaEntity | null = await em.findOne(FileNodeMetaEntity, { parent: null });

		for (const part of parts) {
			if (!currentNode) return null;
			currentNode = await em.findOne(FileNodeMetaEntity, { parent: currentNode, filename: part });
		}
		return currentNode;
	}

	/**
	 * 将数据库实体转换为 IFileStat 接口
	 */
	private _toFileStat(node: FileNodeMetaEntity, path: string): IFileStat {
		return {
			path: path,
			name: node.filename,
			kind: node.kind,
			size: node.size,
			mtime: node.mtime.getTime(),
			meta: node.metadata,
			// `directory` 字段可以根据 path 动态计算
			directory: dirname(path),
		};
	}

	private async _copyNode(
		srcNode: FileNodeMetaEntity,
		destParent: FileNodeMetaEntity,
		newName: string,
		em: EntityManager,
	): Promise<void> {
		// 1. 复制节点本身
		const newNode = em.create(FileNodeMetaEntity, {
			tid: srcNode.tid,
			filename: newName,
			parent: destParent,
			kind: srcNode.kind,
			size: srcNode.size,
			metadata: srcNode.metadata, // deep copy metadata
			content: srcNode.content, // copy small file content
		});

		// 2. 复制大文件内容 (如果存在)
		await em.populate(srcNode, ['fileContent']);
		if (srcNode.fileContent) {
			const newContent = em.create(FileNodeContentEntity, {
				tid: srcNode.tid,
				node: newNode,
				content: srcNode.fileContent.content,
				size: srcNode.fileContent.size,
				md5: srcNode.fileContent.md5,
				sha256: srcNode.fileContent.sha256,
				mimeType: srcNode.fileContent.mimeType,
				metadata: srcNode.fileContent.metadata,
			});
			newNode.fileContent = newContent;
		}

		await em.persistAndFlush(newNode);

		// 3. 如果是目录，递归复制子节点
		if (srcNode.kind === FileKind.DIRECTORY) {
			await em.populate(srcNode, ['children']);
			for (const child of srcNode.children.getItems()) {
				await this._copyNode(child, newNode, child.filename, em);
			}
		}
	}
}

@Entity({ tableName: 'file_node_meta' })
@Unique({ properties: ['tid', 'parent', 'filename'] })
export class FileNodeMetaEntity extends TenantBaseEntity {
	@Property({ type: types.string, nullable: false, comment: '文件名' })
	filename!: string;
	@Property({ type: types.bigint, nullable: false, default: 0, comment: '文件大小' })
	size!: number & Opt;
	@Enum({ items: () => FileKind, nullable: false, comment: '文件类型' })
	kind!: FileKind;

	@Property({ type: types.datetime, nullable: false, defaultRaw: 'CURRENT_TIMESTAMP' })
	atime!: Date & Opt;
	@Property({ type: types.datetime, nullable: false, defaultRaw: 'CURRENT_TIMESTAMP' })
	btime!: Date & Opt;
	@Property({ type: types.datetime, nullable: false, defaultRaw: 'CURRENT_TIMESTAMP' })
	ctime!: Date & Opt;
	@Property({ type: types.datetime, nullable: false, defaultRaw: 'CURRENT_TIMESTAMP' })
	mtime!: Date & Opt;

	@Property({ type: types.json, nullable: false, defaultRaw: '{}' })
	metadata!: Record<string, any>;

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
	@Property({ type: types.blob, nullable: true, comment: '文件内容' })
	content?: Buffer; // for small file, e.g. < 64k

	//region content

	get parentId() {
		return this.parent?.id as Opt<string | undefined>;
	}

	//endregion
}

@Entity({ tableName: 'file_node_content' })
export class FileNodeContentEntity extends TenantBaseEntity {
	@OneToOne({ entity: () => FileNodeMetaEntity, owner: true, primary: true })
	node!: Rel<FileNodeMetaEntity>;

	@Property({ type: types.integer, nullable: false })
	size!: number; // 保留 size 方便查询分析

	@Property({ type: types.blob, lazy: true, comment: '文件内容' })
	content!: Buffer;

	@Property({ type: types.string, nullable: true })
	mimeType?: string;

	@Property({ type: types.string, nullable: false })
	md5?: string;
	@Property({ type: types.string, nullable: false })
	sha256?: string;

	@Property({ type: types.string, nullable: true })
	text?: string;
	@Property({ type: types.integer, nullable: true })
	width?: number;
	@Property({ type: types.integer, nullable: true })
	height?: number;
	// @Property({ type: types.integer, nullable: true })
	// length?: number;

	@Property({ type: types.json, nullable: false, defaultRaw: '{}' })
	metadata!: Record<string, any>;
}

class FileSystemError extends Error {
	constructor(
		message: string,
		public code?: string,
	) {
		super(message);
		this.name = 'FileSystemError';
	}
}
