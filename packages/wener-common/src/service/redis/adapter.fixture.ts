import { vi } from 'vitest';
import type { RedisAdapter } from './interface';

export function fakeRedisAdapter(): RedisAdapter {
	return {
		ping: vi.fn(async () => undefined), get: vi.fn(async () => 'value'),
		getType: vi.fn(async () => 'string'), getTtl: vi.fn(async () => 30),
		scan: vi.fn(async () => ({ cursor: '0', keys: [] })),
		getHash: vi.fn(async () => [{ field: 'name', value: 'alice' }]),
		rangeStream: vi.fn(async () => [{ id: '1-0', fields: [{ field: 'event', value: 'created' }] }]),
		close: vi.fn(async () => undefined),
	};
}
