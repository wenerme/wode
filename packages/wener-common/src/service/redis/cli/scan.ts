import type { RedisScanInput, RedisScanResult, RedisServiceClient } from '../IRedisService';

export const RedisScanLimits = Object.freeze({ keys: 100_000, bytes: 64 * 1024 * 1024, iterations: 10_000 });
export async function scanAll(client: RedisServiceClient, input: RedisScanInput, options: { signal?: AbortSignal }) {
	const pages: RedisScanResult[] = [];
	const encoder = new TextEncoder();
	const seen = new Set<string>();
	let cursor = input.cursor || '0';
	let keyCount = 0;
	let keyBytes = 0;
	for (let index = 0; index < RedisScanLimits.iterations; index++) {
		options.signal?.throwIfAborted();
		if (seen.has(cursor)) throw new Error(`SCAN cursor loop detected at cursor ${cursor}`);
		seen.add(cursor);
		const page = await client.scan({ ...input, cursor }, options);
		options.signal?.throwIfAborted();
		keyCount += page.keys.length;
		if (keyCount > RedisScanLimits.keys) throw new Error(`SCAN exceeded ${RedisScanLimits.keys} keys`);
		for (const key of page.keys) {
			keyBytes += encoder.encode(key).byteLength;
			if (keyBytes > RedisScanLimits.bytes) throw new Error(`SCAN exceeded ${RedisScanLimits.bytes} bytes`);
		}
		pages.push(page);
		cursor = page.cursor || '0';
		if (cursor === '0') return { cursor, keys: pages.flatMap((page) => page.keys), durationMs: pages.reduce((sum, page) => sum + page.durationMs, 0), pages };
	}
	throw new Error(`SCAN did not finish after ${RedisScanLimits.iterations} iterations`);
}
