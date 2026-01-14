import type { EntityManager } from '@mikro-orm/knex';
import { beforeEach, describe, test } from 'vitest';
import { runFileSystemTest } from '../tests/runFileSystemTest';
import { createDatabaseFileSystem, FileNodeMetaEntity } from './createDatabaseFileSystem';
import { loadTestDatabase } from './loadTestDatabase';

// Skip: createDatabaseFileSystem imports from @wener/server which is not a dependency of wener-common
describe.skip('DatabaseFileSystem', () => {
	let fs: ReturnType<typeof createDatabaseFileSystem>;
	let em: EntityManager;

	beforeEach(async () => {
		const { em: entityManager } = await loadTestDatabase();
		em = entityManager as any; // Type cast to match expected EntityManager type

		fs = createDatabaseFileSystem({
			getEntityManager: () => em as any,
		});

		// Setup initial state: ensure root directory exists and create /README.txt
		const rootNode = await fs.ensureRootNode();

		// Create /README.txt file using EntityManager
		const content = Buffer.from('Hello');
		const readmeFile = em.create(FileNodeMetaEntity, {
			filename: 'README.txt',
			parent: rootNode,
			kind: 'file',
			size: content.length,
			content: content,
			atime: new Date(),
			btime: new Date(),
			ctime: new Date(),
			mtime: new Date(),
		});
		await em.persistAndFlush(readmeFile);
	}, 30000); // Increase timeout to 30 seconds

	test('common tests', async () => {
		await runFileSystemTest(fs, {
			writableStream: false,
			readableStream: false,
			readStream: false,
			writeStream: false,
			abort: false,
		});
	}, 60000); // Increase timeout to 60 seconds
});
