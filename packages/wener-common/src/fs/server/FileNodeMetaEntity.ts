import * as crypto from 'node:crypto';
import { BaseEntity, Cascade, Collection, defineEntity, type Opt, p } from '@mikro-orm/core';
import type { FileKind } from '../types';
import { FileNodeContentEntitySchema } from './FileNodeContentEntity';

export const FileNodeMetaEntitySchema = defineEntity({
	name: 'FileNodeMetaEntity',
	tableName: 'file_node_meta',
	extends: BaseEntity,
	uniques: [{ properties: ['tid', 'parent', 'filename'] }],
	properties: {
		id: p
			.text()
			.primary()
			.onCreate(() => crypto.randomUUID()),
		tid: p.text().nullable(),
		filename: p.text(),
		size: p.integer().default(0),
		kind: p.text().$type<FileKind>(),
		atime: p.text().$type<Date>(),
		btime: p.text().$type<Date>(),
		ctime: p.text().$type<Date>(),
		mtime: p.text().$type<Date>(),
		metadata: p.json<Record<string, any>>().default('{}'),
		parent: () => p.manyToOne(FileNodeMetaEntitySchema).nullable().cascade(),
		children: () => p.oneToMany(FileNodeMetaEntitySchema).mappedBy('parent').orphanRemoval(),
		fileContent: () =>
			p.oneToOne(FileNodeContentEntitySchema).mappedBy('node').orphanRemoval().nullable().cascade(Cascade.ALL),
		content: p.blob().$type<Buffer>().nullable(),
	},
});

export class FileNodeMetaEntity extends FileNodeMetaEntitySchema.class {
	children = new Collection<FileNodeMetaEntity>(this);

	get parentId() {
		return this.parent?.id as Opt<string | undefined>;
	}
}
FileNodeMetaEntitySchema.setClass(FileNodeMetaEntity);
