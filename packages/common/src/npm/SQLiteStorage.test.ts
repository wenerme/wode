import { assert, test } from 'vite-plus/test';
import { SQLiteStorage } from './SQLiteStorage';

test('SQLiteStorage stores ArrayBuffer and views using their exact byte ranges', async () => {
	const storage = new SQLiteStorage({ database: ':memory:' });
	await storage.init();

	const source = new Uint8Array([9, 8, 7, 6]);
	await storage.saveRawFile({
		url: 'https://example.com/archive.tgz',
		name: 'example',
		version: '1.0.0',
		data: source.buffer,
	});
	await storage.saveRawFile({
		url: 'https://example.com/archive-view.tgz',
		name: 'example-view',
		version: '1.0.0',
		data: new Uint8Array(source.buffer, 1, 2),
	});

	assert.deepEqual(
		Array.from(new Uint8Array((await storage.getRawFileDataByUrl('https://example.com/archive.tgz')) as ArrayBuffer)),
		[9, 8, 7, 6],
	);
	assert.deepEqual(
		Array.from(
			new Uint8Array((await storage.getRawFileDataByUrl('https://example.com/archive-view.tgz')) as ArrayBuffer),
		),
		[8, 7],
	);
});
