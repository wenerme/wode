import { inspect } from 'node:util';
import type { Options as BetterSqliteOptions } from '@mikro-orm/better-sqlite';
import { Errors, ulid } from '@wener/utils';
import type { Database } from 'better-sqlite3';
import { FileNodeContentEntity, FileNodeMetaEntity } from './createDatabaseFileSystem';

export async function loadTestDatabase({ options }: { options?: BetterSqliteOptions } = {}) {
	const { MikroORM: SqliteMikroORM } = await import('@mikro-orm/better-sqlite');

	const orm = await SqliteMikroORM.init({
		dbName: ':memory:',
		entities: [FileNodeContentEntity, FileNodeMetaEntity],
		discovery: {
			disableDynamicFileAccess: true,
			requireEntitiesArray: true,
		},
		serialization: {
			includePrimaryKeys: true,
			forceObject: true,
		},
		findOneOrFailHandler(entityName, where) {
			throw Errors.NotFound.asError(`未找到数据: ${entityName} ${inspect(where)}`);
		},
		findExactlyOneOrFailHandler(entityName, where) {
			throw Errors.BadRequest.asError(`错误的数据数量: ${entityName} ${inspect(where)}`);
		},
		...options,
	});

	const knex = orm.em.getKnex();
	{
		const db: Database = await knex.client.acquireConnection();
		db.function('ulid', () => ulid());
		await knex.client.releaseConnection(db);
	}

	// Execute schema creation
	for (const stmt of FileSystemSchema.split(';')) {
		const sql = stmt.trim();
		if (sql) {
			await knex.raw(sql);
		}
	}

	return {
		orm,
		em: orm.em.fork(),
	};
}

export const FileSystemSchema = `
CREATE TABLE IF NOT EXISTS "file_node_meta"
(
    -- Base fields
    "id"         TEXT PRIMARY KEY NOT NULL DEFAULT (ulid()),
    "tid"        TEXT,
    "uid"        TEXT,
    "eid"        TEXT,
    "created_at" TEXT             NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT             NOT NULL DEFAULT (datetime('now')),
    "deleted_at" TEXT,
    "attributes" TEXT,
    "properties" TEXT,
    "extensions" TEXT,

    -- File identification
    "filename"   TEXT             NOT NULL,
    "size"       INTEGER          NOT NULL DEFAULT 0,
    "kind"       TEXT             NOT NULL,

    -- Timestamps
    "atime"      TEXT             NOT NULL,
    "btime"      TEXT             NOT NULL,
    "ctime"      TEXT             NOT NULL,
    "mtime"      TEXT             NOT NULL,

    -- Metadata
    "metadata"   TEXT             NOT NULL DEFAULT '{}',

    -- Hierarchy
    "parent_id"  TEXT,

    -- Small file content (for files < 64KB)
    "content"    BLOB,

    FOREIGN KEY ("parent_id") REFERENCES "file_node_meta" ("id")
);

CREATE INDEX IF NOT EXISTS "idx_file_node_meta_filename" ON "file_node_meta" ("filename");
CREATE INDEX IF NOT EXISTS "idx_file_node_meta_parent_id" ON "file_node_meta" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_file_node_meta_tid_parent_filename" ON "file_node_meta" ("tid", "parent_id", "filename");

CREATE TABLE IF NOT EXISTS "file_node_content"
(
    -- Base fields
    "id"         TEXT PRIMARY KEY NOT NULL DEFAULT (ulid()),
    "node_id"    TEXT             NOT NULL UNIQUE,
    "tid"        TEXT,
    "uid"        TEXT,
    "eid"        TEXT,
    "created_at" TEXT             NOT NULL DEFAULT (datetime('now')),
    "updated_at" TEXT             NOT NULL DEFAULT (datetime('now')),
    "deleted_at" TEXT,
    "attributes" TEXT,
    "properties" TEXT,
    "extensions" TEXT,

    -- Content information
    "size"       INTEGER          NOT NULL,
    "content"    BLOB,

    -- File properties
    "mime_type"  TEXT,

    -- Checksums
    "md5"        TEXT,
    "sha256"     TEXT,

    -- Content metadata
    "text"       TEXT,
    "width"      INTEGER,
    "height"     INTEGER,

    -- Additional metadata
    "metadata"   TEXT             NOT NULL DEFAULT '{}',

    FOREIGN KEY ("node_id") REFERENCES "file_node_meta" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_file_node_content_node_id" ON "file_node_content" ("node_id");
`;
