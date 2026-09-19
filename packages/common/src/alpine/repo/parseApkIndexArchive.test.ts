import { gzipSync } from 'node:zlib';
import tar from 'tar-stream';
import { assert, test } from 'vite-plus/test';
import { parseApkIndexArchive } from './parseApkIndexArchive';

async function createApkIndexArchive() {
	const pack = tar.pack();
	const chunks: Buffer[] = [];
	const output = new Promise<Buffer>((resolve, reject) => {
		pack.on('data', (chunk) => chunks.push(Buffer.from(chunk as Uint8Array)));
		pack.on('end', () => resolve(gzipSync(Buffer.concat(chunks))));
		pack.on('error', reject);
	});

	pack.entry({ name: 'DESCRIPTION' }, 'v3.22-0-abcdef');
	pack.entry({ name: 'APKINDEX', mtime: new Date('2024-01-02T03:04:05Z') }, 'P:busybox\nV:1.36.1-r0\n');
	pack.entry({ name: '.SIGN.RSA.alpine-devel@lists.alpinelinux.org-6165ee59.rsa.pub' }, Buffer.from([1, 2, 3]));
	pack.finalize();

	return output;
}

test('parseApkIndexArchive inflates a gzip archive from an ArrayBuffer', async () => {
	const archive = await createApkIndexArchive();
	const content = await parseApkIndexArchive(new Uint8Array(archive).slice().buffer);

	assert.equal(content.description, 'v3.22-0-abcdef');
	assert.equal(content.apkindex, 'P:busybox\nV:1.36.1-r0\n');
	assert.equal(content.signName, '.SIGN.RSA.alpine-devel@lists.alpinelinux.org-6165ee59.rsa.pub');
	assert.deepEqual(Array.from(new Uint8Array(content.signData)), [1, 2, 3]);
	assert.equal(content.mtime.toISOString(), '2024-01-02T03:04:05.000Z');
});
