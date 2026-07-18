import { BaseEntity } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/sql';
import { beforeEach, describe, expect, test } from 'vite-plus/test';
import { runFileSystemBenchmark } from '../tests/runFileSystemBenchmark';
import {
	runFileSystemTestBasic,
	runFileSystemTestCopyOperations,
	runFileSystemTestDirectoryOperations,
	runFileSystemTestEdgeCases,
	runFileSystemTestFileOperations,
	runFileSystemTestRemoveOperations,
	runFileSystemTestRenameOperations,
	runFileSystemTestStreams,
	runFileSystemTestValidation,
} from '../tests/runFileSystemTest';
import { createDatabaseFileSystem, FileNodeContentEntity, FileNodeMetaEntity } from './createDatabaseFileSystem';
import { loadTestDatabase } from './loadTestDatabase';

const unsupportedCapabilities = {
	writableStream: false,
	readableStream: false,
	readStream: false,
	writeStream: false,
	abort: false,
};

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

	test('basic stat/list/root behavior', async () => {
		await runFileSystemTestBasic(fs);
	}, 60000);

	test('input validation', async () => {
		await runFileSystemTestValidation(fs);
	}, 60000);

	test('streams are capability-gated', async () => {
		await runFileSystemTestStreams(fs, unsupportedCapabilities);
	}, 60000);

	test('file operations', async () => {
		await runFileSystemTestFileOperations(fs);
	}, 60000);

	test('directory operations', async () => {
		await runFileSystemTestDirectoryOperations(fs);
	}, 60000);

	test('remove operations', async () => {
		await runFileSystemTestRemoveOperations(fs);
	}, 60000);

	test('rename operations', async () => {
		await runFileSystemTestRenameOperations(fs);
	}, 60000);

	test('copy operations', async () => {
		await runFileSystemTestCopyOperations(fs);
	}, 60000);

	test('edge cases', async () => {
		await runFileSystemTestEdgeCases(fs);
	}, 60000);

	test('root node exists', async () => {
		const stat = await fs.stat('/');
		expect(stat.kind).toBe('directory');
	});

	test('benchmark smoke', async () => {
		const result = await runFileSystemBenchmark(fs, {
			smallFileCount: 30,
			largeFileCount: 6,
			largeFileSize: 8 * 1024,
			concurrency: 6,
			log: () => {},
		});
		expect(result.ops).toBeGreaterThan(0);
		expect(result.bytesRead).toBe(result.bytesWritten);
		expect(result.opsPerSecond).toBeGreaterThan(0);
	}, 60000);

	test('defineEntity runtime shape and storage paths', async () => {
		const meta = new FileNodeMetaEntity();
		const contentEntity = new FileNodeContentEntity();
		expect(meta).toBeInstanceOf(BaseEntity);
		expect(contentEntity).toBeInstanceOf(BaseEntity);
		expect(typeof meta.assign).toBe('function');
		expect(typeof contentEntity.assign).toBe('function');

		await fs.writeFile('/small.txt', 'small');
		const smallNode = await em.findOneOrFail(FileNodeMetaEntity, { filename: 'small.txt' });
		expect(Buffer.from(smallNode.content ?? []).toString()).toBe('small');
		expect(await em.findOne(FileNodeContentEntity, { node: smallNode })).toBeNull();

		const large = 'x'.repeat(1024);
		await fs.writeFile('/large.bin', large);
		const largeNode = await em.findOneOrFail(FileNodeMetaEntity, { filename: 'large.bin' });
		const largeContent = await em.findOneOrFail(FileNodeContentEntity, { node: largeNode });
		expect(largeNode.content).toBeNull();
		await em.populate(largeContent, ['content']);
		expect(Buffer.from(largeContent.content).toString()).toBe(large);
		expect(await fs.readFile('/large.bin', { encoding: 'text' })).toBe(large);
	});
});
