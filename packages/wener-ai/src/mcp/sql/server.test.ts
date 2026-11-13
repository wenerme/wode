import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import {
	type CompiledQuery,
	type DatabaseConnection,
	type Driver,
	Kysely,
	MysqlAdapter,
	MysqlIntrospector,
	MysqlQueryCompiler,
	type QueryResult,
} from 'kysely';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { SqlQueryCanceller } from './cancellableQuery';
import { createSqlMcpServer } from './server';
import { createKyselyInstance } from './utils';

vi.mock('./utils', async (importOriginal) => ({
	...(await importOriginal<typeof import('./utils')>()),
	createKyselyInstance: vi.fn(),
}));

/** 假 MySQL：会话 ID 固定 42；含 `fast` 的查询立即返回，其它查询挂起直到 `settleAll`。 */
function createFakeDb() {
	const pending: Array<() => void> = [];
	let destroyed = 0;
	const connection: DatabaseConnection = {
		async executeQuery<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
			if (compiled.sql.includes('CONNECTION_ID()')) return { rows: [{ id: 42 } as R] };
			if (compiled.sql.includes('fast')) return { rows: [{ ok: 1 } as R] };
			return new Promise((resolve) => pending.push(() => resolve({ rows: [] })));
		},
		async *streamQuery() {},
	};
	const driver: Driver = {
		async init() {},
		async acquireConnection() {
			return connection;
		},
		async beginTransaction() {},
		async commitTransaction() {},
		async rollbackTransaction() {},
		async releaseConnection() {},
		async destroy() {
			destroyed++;
		},
	};
	const db = new Kysely<any>({
		dialect: {
			createAdapter: () => new MysqlAdapter(),
			createDriver: () => driver,
			createIntrospector: (kysely) => new MysqlIntrospector(kysely),
			createQueryCompiler: () => new MysqlQueryCompiler(),
		},
	});
	// RuntimeDriver 只销毁一次 driver：用 spy 记下 db.destroy() 被调用的次数。
	const destroyCalls = vi.spyOn(db, 'destroy');
	return {
		db,
		destroyCalls: () => destroyCalls.mock.calls.length,
		pendingCount: () => pending.length,
		settleAll: () => {
			for (const settle of pending.splice(0)) settle();
		},
		destroyed: () => destroyed,
	};
}

describe('createSqlMcpServer：取消失败后 Kysely 实例被销毁，下次调用重新建连', () => {
	const fakes: Array<ReturnType<typeof createFakeDb>> = [];

	afterEach(() => {
		for (const fake of fakes.splice(0)) fake.settleAll();
		vi.mocked(createKyselyInstance).mockReset();
	});

	async function setup(cancel: SqlQueryCanceller) {
		// 不给 rawConnection：mysql 走 executeCancellableQuery（取消不明时会销毁整个 Kysely 实例）。
		vi.mocked(createKyselyInstance).mockImplementation(async () => {
			const fake = createFakeDb();
			fakes.push(fake);
			return { db: fake.db, ownsConnection: true };
		});
		const instance = createSqlMcpServer({ url: 'mysql://fake/db', readOnly: true, createCanceller: () => cancel });
		const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
		await instance.server.connect(serverTransport);
		const client = new Client({ name: 'sql-destroy-test', version: '1.0.0' });
		await client.connect(clientTransport);
		const call = (sql: string, signal?: AbortSignal) =>
			client.callTool({ name: 'query_json', arguments: { sql } }, signal ? { signal } : undefined);
		/** 发起一个会挂起的查询，等它真的在假库上执行后返回中止函数。 */
		const startSlow = async (fake: () => ReturnType<typeof createFakeDb> | undefined) => {
			const controller = new AbortController();
			const before = fake()?.pendingCount() ?? 0;
			const running = call('SELECT slow', controller.signal).catch((error: unknown) => error);
			await vi.waitFor(() => expect(fake()?.pendingCount()).toBe(before + 1));
			return { abort: () => controller.abort(), running };
		};
		return { instance, client, call, startSlow };
	}

	test('取消返回 error：销毁当前实例，下一次调用重新 createKyselyInstance', async () => {
		const { instance, client, call, startSlow } = await setup(async () => ({ outcome: 'error', error: 'boom' }));
		try {
			expect(await call('SELECT fast')).toMatchObject({ content: [{ text: expect.stringContaining('"ok": 1') }] });
			expect(createKyselyInstance).toHaveBeenCalledTimes(1);
			const first = fakes[0];
			const slow = await startSlow(() => first);
			slow.abort();
			await slow.running;
			await vi.waitFor(() => expect(first?.destroyed()).toBe(1));

			expect(await call('SELECT fast')).toMatchObject({ content: [{ text: expect.stringContaining('"ok": 1') }] });
			expect(createKyselyInstance).toHaveBeenCalledTimes(2);
			expect((await instance.loadDb()).db).toBe(fakes[1]?.db);
			expect(fakes[1]?.destroyed()).toBe(0);
		} finally {
			await client.close();
			await instance.close();
		}
	});

	test('并发：旧实例上另一个查询晚到的销毁通知，不清掉已经重建的新实例', async () => {
		const { instance, client, call, startSlow } = await setup(() => {
			throw new Error('cancel failed');
		});
		try {
			await call('SELECT fast');
			const first = fakes[0];
			const a = await startSlow(() => first);
			const b = await startSlow(() => first);
			a.abort();
			await a.running;
			await vi.waitFor(() => expect(first?.destroyed()).toBe(1));

			// 重建新实例。
			await call('SELECT fast');
			expect(createKyselyInstance).toHaveBeenCalledTimes(2);
			const second = (await instance.loadDb()).db;
			expect(second).toBe(fakes[1]?.db);

			// 旧实例上的另一个查询现在才被中止：只销毁旧实例，缓存里的新实例保留。
			b.abort();
			await b.running;
			await vi.waitFor(() => expect(first?.destroyCalls()).toBe(2));
			await call('SELECT fast');
			expect(createKyselyInstance).toHaveBeenCalledTimes(2);
			expect((await instance.loadDb()).db).toBe(second);
			expect(fakes[1]?.destroyed()).toBe(0);
		} finally {
			await client.close();
			await instance.close();
		}
	});
});
