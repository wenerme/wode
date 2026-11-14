import { describe, expect, test, vi } from 'vitest';
import { createKyselyInstance } from './utils';

const pools: Array<{ end: ReturnType<typeof vi.fn> }> = [];
type MockConnection = {
	query: ReturnType<typeof vi.fn>;
	release: ReturnType<typeof vi.fn>;
};

vi.mock('mysql2', () => ({
	createPool: vi.fn(() => {
		const connection: MockConnection = {
			query: vi.fn((...args: unknown[]) => {
				const callback = args.at(-1);
				if (typeof callback === 'function') {
					callback(new Error('initialization query failed'));
					return;
				}
				return Promise.reject(new Error('initialization query failed'));
			}),
			release: vi.fn(),
		};
		const end = vi.fn((callback: (error?: Error) => void) => callback());
		const pool = {
			getConnection: vi.fn((callback: (error: Error | null, connection: MockConnection) => void) =>
				callback(null, connection),
			),
			end,
		};
		pools.push(pool);
		return pool;
	}),
}));

describe('createKyselyInstance：初始化查询失败时销毁已创建的连接池', () => {
	test('连续失败不会留下或复用前一次的池', async () => {
		await expect(createKyselyInstance('mysql://fake/db', 'mysql')).rejects.toThrow('initialization query failed');
		await expect(createKyselyInstance('mysql://fake/db', 'mysql')).rejects.toThrow('initialization query failed');

		expect(pools).toHaveLength(2);
		expect(pools[0]?.end).toHaveBeenCalledTimes(1);
		expect(pools[1]?.end).toHaveBeenCalledTimes(1);
		expect(pools[0]).not.toBe(pools[1]);
	});
});
