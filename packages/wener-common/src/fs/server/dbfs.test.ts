import type { EntityManager } from '@mikro-orm/sql';
import { beforeEach, describe, expect, test } from 'vitest';
import { runFileSystemTest } from '../tests/runFileSystemTest';
import { createDatabaseFileSystem, FileNodeMetaEntity } from './createDatabaseFileSystem';
import { loadTestDatabase } from './loadTestDatabase';

describe('DatabaseFileSystem', () => {
	let fs: ReturnType<typeof createDatabaseFileSystem>;
	let em: EntityManager;

	beforeEach(async () => {
		const { em: entityManager } = await loadTestDatabase();
		em = entityManager as any;

		fs = createDatabaseFileSystem({
			getEntityManager: () => (em as any).fork(),
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
		} as any);
		await em.persist(readmeFile).flush();
	}, 30000);

	test('common tests', async () => {
		await runFileSystemTest(fs, {
			writableStream: false,
			readableStream: false,
			readStream: false,
			writeStream: false,
			abort: false,
		});
	}, 60000);

	test('root node exists', async () => {
		const stat = await fs.stat('/');
		expect(stat.kind).toBe('directory');
	});
});
