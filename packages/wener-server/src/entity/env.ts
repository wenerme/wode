import { MetadataStorage } from '@mikro-orm/core';
import { Errors, getObjectId } from '@wener/utils';

/**
 * Make sure there is only one MikroORM MetadataStorage reference, helping dedupe modules.
 */
export function checkMikroOrmEnv(opts: { MetadataStorage?: any } = {}) {
	opts.MetadataStorage &&
		Errors.BadRequest.check(
			opts.MetadataStorage === MetadataStorage,
			`MetadataStorage instance mismatch: ${getObjectId(opts.MetadataStorage)} -> ${getObjectId(MetadataStorage)}`,
		);

	return { MetadataStorage, MetadataStorageId: getObjectId(MetadataStorage) };
}
