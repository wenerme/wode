import * as crypto from 'node:crypto';
import { BaseEntity, defineEntity, p } from '@mikro-orm/core';
import { FileNodeMetaEntitySchema } from './FileNodeMetaEntity';

export const FileNodeContentEntitySchema = defineEntity({
	name: 'FileNodeContentEntity',
	tableName: 'file_node_content',
	extends: BaseEntity,
	properties: {
		id: p
			.text()
			.primary()
			.onCreate(() => crypto.randomUUID()),
		tid: p.text().nullable(),
		node: () => p.oneToOne(FileNodeMetaEntitySchema).owner().joinColumn('node_id'),
		size: p.integer(),
		content: p.blob().$type<Buffer>().lazy(),
		mimeType: p.text().nullable(),
		md5: p.text().nullable(),
		sha256: p.text().nullable(),
		text: p.text().nullable(),
		width: p.integer().nullable(),
		height: p.integer().nullable(),
		metadata: p.json<Record<string, any>>().default('{}'),
	},
});

export class FileNodeContentEntity extends FileNodeContentEntitySchema.class {}
FileNodeContentEntitySchema.setClass(FileNodeContentEntity);
