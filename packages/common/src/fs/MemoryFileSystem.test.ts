import { beforeEach, describe, test } from 'vitest';
import { createMemoryFileSystem } from './createMemoryFileSystem';
import { runFileSystemTest } from './tests/runFileSystemTest';

describe('MemoryFileSystem', () => {
	let fs: ReturnType<typeof createMemoryFileSystem>;

	beforeEach(() => {
		fs = createMemoryFileSystem({
			root: {
				path: '/',
				directory: '',
				name: '',
				kind: 'directory',
				meta: {},
				mtime: Date.now(),
				size: 0,
				children: [
					{
						path: '/README.txt',
						directory: '/',
						name: 'README.txt',
						kind: 'file',
						content: 'Hello',
						size: 5,
						meta: {},
						mtime: Date.now(),
					},
				],
			},
		});
	});

	test('common tests', async () => {
		await runFileSystemTest(fs);
	});
});
