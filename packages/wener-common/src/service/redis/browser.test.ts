import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

describe('Redis browser boundary', () => {
	it('bundles and runs the service root without Node globals or native drivers', async () => {
		const result = await build({
			entryPoints: [fileURLToPath(new URL('./index.ts', import.meta.url))], bundle: true,
			platform: 'browser', format: 'iife', globalName: 'Redis', write: false, metafile: true,
			treeShaking: false, logLevel: 'silent',
		});
		expect(Object.keys(result.metafile.inputs).filter((name) => /node:|\/ioredis\/|\/native\/|\/orpc\//u.test(name))).toEqual([]);
		const code = result.outputFiles[0].text;
		expect(code).not.toMatch(/\bBuffer\b|\bprocess\./u);
		const sandbox = { TextEncoder, URL, AbortSignal };
		runInNewContext(code, sandbox);
		const redis = (sandbox as typeof sandbox & { Redis: typeof import('./index') }).Redis;
		const service = await redis.createRedisService(redis.resolveRedisConnectionOptions({ options: { host: 'cache.example.test', keyPrefix: 'tenant:' } }), {
			createAdapter: () => ({ ping: async () => '8.0.0', get: async (key) => key, getType: async () => 'string', getTtl: async () => -1,
				scan: async () => ({ cursor: '0', keys: [] }), getHash: async () => [], rangeStream: async () => [], close: async () => {} }),
		});
		await expect(service.get({ key: 'é' })).resolves.toMatchObject({ value: 'tenant:é' });
		await service.close();
	});
});
