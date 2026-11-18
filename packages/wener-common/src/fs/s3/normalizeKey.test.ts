import { S3mini } from 's3mini';
import { describe, expect, it, vi } from 'vitest';
import { createS3MiniFileSystem } from './createS3MiniFileSystem';

describe('S3 filesystem key confinement', () => {
	it('rejects backslash, .. and control-character escapes without fetching', async () => {
		const fetch = vi.fn(async () => new Response('', { status: 200 }));
		const config = { accessKeyId: 'k', secretAccessKey: 's', endpoint: 'https://s3.example.test/bucket', region: 'auto', fetch };
		const fs = createS3MiniFileSystem({
			url: 'https://s3.example.test/bucket',
			bucket: 'bucket',
			client: new S3mini(config),
			createReadClient: () => new S3mini(config),
			prefix: 'pfx',
		});
		for (const path of ['..\\..\\other-bucket\\secret', '../other', 'a/../../x', 'a\u0000b', 'x\\..\\..\\y'])
			await expect(fs.readFile(path)).rejects.toMatchObject({ code: expect.stringMatching(/^(EACCES|EINVAL)$/u) });
		expect(fetch).not.toHaveBeenCalled();
	});
});
