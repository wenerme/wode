import { describe, expect, it, vi } from 'vitest';
import { createSqlService } from '@wener/common/service/sql';
import { createSqliteAdapter } from './native/sql';
import { createPostgresAdapter } from './native/sql-postgres';

const expensive = {
	statement: 'WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x < 1000000000) SELECT sum(x) FROM n',
	limit: 1,
};

describe('SQL contract calls through native adapters', () => {
	it.each(['query', 'exec'] as const)('maps context timeout into the SQLite %s worker and preserves driver close behavior', async (method) => {
		const service = createSqlService({ adapter: createSqliteAdapter({ filename: ':memory:', readOnly: false, timeoutMs: 5000, busyTimeoutMs: 1000 }), readOnly: false });
		try {
			await service.ping();
			const input = method === 'exec' ? { statement: expensive.statement } : expensive;
			await expect(service[method](input, { context: { timeoutMs: 20 } })).rejects.toEqual(new Error('SQL operation failed'));
			await expect(service.ping()).rejects.toThrow('SQL operation failed');
		} finally {
			const first = service.close();
			expect(service.close()).toBe(first);
			await first;
		}
		await expect(service.ping()).rejects.toThrow('SQL service is closed');
	});

	it('interrupts SQLite through the contract signal and hides the caller cancellation reason', async () => {
		const service = createSqlService({ adapter: createSqliteAdapter({ filename: ':memory:', readOnly: true, timeoutMs: 5000, busyTimeoutMs: 1000 }) });
		try {
			await service.ping();
			const controller = new AbortController();
			const pending = service.query(expensive, { signal: controller.signal });
			const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError', message: 'SQL operation aborted' });
			controller.abort(new Error('postgres://user:secret@host SELECT private'));
			await rejected;
		} finally {
			await service[Symbol.asyncDispose]();
		}
	});

	it.each(['timeout', 'abort', 'close'])('discards an in-flight PostgreSQL connection on contract %s', async (mode) => {
		const release = vi.fn();
		let started!: () => void;
		const running = new Promise<void>((resolve) => { started = resolve; });
		const query = vi.fn(async (statement: string) => {
			if (statement === 'BEGIN READ ONLY') return { rows: [], fields: [], rowCount: 0 };
			started();
			return new Promise<never>(() => {});
		});
		const pool = { connect: vi.fn(async () => ({ query, release })), end: vi.fn(async () => {}) };
		const adapter = await createPostgresAdapter({ connectionString: 'postgres://example.test/fixture', timeoutMs: 5000, connectTimeoutMs: 1000, pool: pool as never });
		const service = createSqlService({ adapter });
		try {
			const controller = new AbortController();
			const pending = service.query({ statement: 'SELECT 1' }, { signal: controller.signal, context: { timeoutMs: mode === 'timeout' ? 20 : 5000 } });
			const rejected = expect(pending).rejects.toThrow(mode === 'abort' ? 'SQL operation aborted' : mode === 'close' ? 'SQL service is closed' : 'SQL operation failed');
			await running;
			if (mode === 'abort') controller.abort(new Error('private connection string'));
			if (mode === 'close') await service.close();
			await rejected;
			expect(release).toHaveBeenCalledExactlyOnceWith(true);
		} finally {
			await service.close();
		}
		expect(pool.end).toHaveBeenCalledOnce();
	});
});
