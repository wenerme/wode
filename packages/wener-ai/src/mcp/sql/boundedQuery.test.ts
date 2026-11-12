import { EventEmitter } from 'node:events';
import { describe, expect, test, vi } from 'vitest';
import {
	capSqlTableCell,
	createSqlRowCollector,
	encodeSqlRowsJson,
	executeBoundedQuery,
	fitSqlResultText,
	resolveSqlResultLimits,
	type SqlRawConnection,
	SqlResultLimitsDefault,
	SqlResultMinBytes,
	SqlTableMaxCellChars,
} from './boundedQuery';
import { SqlQueryAbortedError } from './cancellableQuery';
import { sqlTruncationNotice } from './tools/query';
import { formatTable } from './utils';

const bytes = (text: string) => Buffer.byteLength(text, 'utf8');

describe('resolveSqlResultLimits：工具参数只能调小', () => {
	test('取 min(请求, 服务端)；非正整数忽略', () => {
		const server = { maxRows: 10_000, maxResultBytes: 8 << 20 };
		expect(resolveSqlResultLimits(server, undefined)).toEqual(server);
		expect(resolveSqlResultLimits(server, { maxRows: 100, maxResultBytes: 1024 })).toEqual({
			maxRows: 100,
			maxResultBytes: 1024,
		});
		expect(resolveSqlResultLimits(server, { maxRows: 1e9, maxResultBytes: 1e12 })).toEqual(server);
		expect(resolveSqlResultLimits(server, { maxRows: 0, maxResultBytes: -1 })).toEqual(server);
		expect(resolveSqlResultLimits(server, { maxRows: 1.5 })).toEqual(server);
		expect(SqlResultLimitsDefault).toEqual({ maxRows: 10_000, maxResultBytes: 8 * 1024 * 1024 });
	});

	test('字节上限有下限 1 KiB：参数或服务端配置更小都按 1 KiB 算', () => {
		expect(SqlResultMinBytes).toBe(1024);
		expect(resolveSqlResultLimits({ maxRows: 10, maxResultBytes: 8 << 20 }, { maxResultBytes: 1 })).toMatchObject({
			maxResultBytes: 1024,
		});
		expect(resolveSqlResultLimits({ maxRows: 10, maxResultBytes: 100 }, undefined)).toMatchObject({
			maxResultBytes: 1024,
		});
	});
});

/** 形态各异的行：嵌套、多字节字符、BigInt、null、空对象、数组、需要转义的字符。 */
const SampleRows: unknown[] = [
	{ id: 1, name: 'a' },
	{ id: 2n, name: '中文与 emoji 😀', tags: ['x', 'y'], nested: { a: { b: [1, 2, { c: null }] } } },
	{ id: 3, quote: 'he said "hi"\n\tnext', empty: {}, list: [] },
	{ id: 4, name: null },
];

describe('createSqlRowCollector：按最终输出编码计字节', () => {
	test('json：逐行累加的字节数与 encodeSqlRowsJson（缩进 2）完全相等——边界上恰好放得下、少 1 字节就截断', () => {
		for (let n = 0; n <= SampleRows.length; n++) {
			const rows = SampleRows.slice(0, n);
			const exact = bytes(encodeSqlRowsJson(rows));
			const fits = createSqlRowCollector<unknown>({ maxRows: 100, maxResultBytes: exact }, 'json');
			for (const row of rows) expect(fits.push(row)).toBe(true);
			expect(fits.truncated).toBeUndefined();
			if (n === 0) continue;
			const tight = createSqlRowCollector<unknown>({ maxRows: 100, maxResultBytes: exact - 1 }, 'json');
			const accepted = rows.map((row) => tight.push(row));
			expect(accepted.at(-1)).toBe(false);
			expect(tight.rows).toHaveLength(n - 1);
			// 保留下来的部分，最终输出不超过上限。
			expect(bytes(encodeSqlRowsJson(tight.rows))).toBeLessThanOrEqual(exact - 1);
		}
	});

	test('行数上限：第 maxRows+1 行触发截断，保留 maxRows 行', () => {
		const collector = createSqlRowCollector<{ i: number }>({ maxRows: 3, maxResultBytes: 1 << 20 });
		expect([0, 1, 2, 3, 4].map((i) => collector.push({ i }))).toEqual([true, true, true, false, false]);
		expect(collector.rows).toHaveLength(3);
		expect(collector.truncated).toMatchObject({ reason: 'max_rows' });
	});

	test('json：单行就超过上限 → row_too_large（不论是不是第一行）；巨大字段不序列化就判定', () => {
		const limits = { maxRows: 100, maxResultBytes: 1000 };
		const first = createSqlRowCollector<unknown>(limits, 'json');
		expect(first.push({ blob: 'x'.repeat(2000) })).toBe(false);
		expect(first.truncated).toMatchObject({ reason: 'row_too_large' });
		const later = createSqlRowCollector<unknown>(limits, 'json');
		expect(later.push({ id: 1 })).toBe(true);
		expect(later.push({ blob: Buffer.alloc(5000) })).toBe(false);
		expect(later.truncated).toMatchObject({ reason: 'row_too_large' });
		expect(later.rows).toHaveLength(1);
		const stringify = vi.spyOn(JSON, 'stringify');
		try {
			createSqlRowCollector<unknown>(limits, 'json').push({ blob: 'y'.repeat(1_000_000) });
			expect(stringify).not.toHaveBeenCalled();
		} finally {
			stringify.mockRestore();
		}
	});

	test('table 单元格截断：超过 256 个 code point 截断为前 255 个 + …；emoji 不切开；Buffer/TypedArray 只取前缀；幂等', () => {
		expect(capSqlTableCell(null)).toEqual({ text: '', cut: false });
		expect(capSqlTableCell(12n)).toEqual({ text: '12', cut: false });
		expect(capSqlTableCell('a'.repeat(SqlTableMaxCellChars))).toEqual({ text: 'a'.repeat(256), cut: false });
		expect(capSqlTableCell('a'.repeat(257))).toEqual({ text: `${'a'.repeat(255)}…`, cut: true });
		const emoji = capSqlTableCell('😀'.repeat(300));
		expect(emoji.cut).toBe(true);
		expect([...emoji.text]).toHaveLength(SqlTableMaxCellChars);
		expect(emoji.text.endsWith('😀…')).toBe(true);
		const big = Buffer.alloc(10_000_000, 0x61);
		const subarray = vi.spyOn(big, 'subarray');
		expect(capSqlTableCell(big)).toEqual({ text: `${'a'.repeat(255)}…`, cut: true });
		// 只转换了前缀（(256 + 1) × 4 字节），没有把 10 MB 都转成字符串。
		expect(subarray).toHaveBeenCalledWith(0, (SqlTableMaxCellChars + 1) * 4);
		expect(capSqlTableCell(new Uint8Array(1_000_000))).toMatchObject({ cut: true });
		expect(capSqlTableCell(new Uint8Array([1, 2, 3]))).toEqual({ text: '1,2,3', cut: false });
		// 截断是幂等的：已截断的值再截一次不变（收尾时可能再过一遍）。
		const once = capSqlTableCell('b'.repeat(1000));
		expect(capSqlTableCell(once.text)).toEqual({ text: once.text, cut: false });
	});

	test('table：字节按 formatTable 的输出精确计（含列宽撑大、多字节、null、长列名）——恰好放得下、少 1 字节就少一行', () => {
		const rows = [
			{ id: 1, name: 'a', note: null },
			{ id: 22, name: '中文与 emoji 😀', note: 'x' },
			{ id: 333, name: 'w'.repeat(200), note: 'y' },
			{ id: 4, name: 'b', note: 'z'.repeat(10) },
		];
		for (let n = 1; n <= rows.length; n++) {
			const slice = rows.slice(0, n);
			const exact = bytes(formatTable(slice));
			const limits = { maxRows: 100, maxResultBytes: exact };
			const fits = fitSqlResultText({ rows: slice, limits }, formatTable, 'table');
			expect(fits.text).toBe(formatTable(slice));
			expect(fits.result.rows).toHaveLength(n);
			expect(fits.result.truncated).toBeUndefined();
			if (n === 1) continue;
			const tight = fitSqlResultText(
				{ rows: slice, limits: { ...limits, maxResultBytes: exact - 1 } },
				formatTable,
				'table',
			);
			expect(tight.result.rows).toHaveLength(n - 1);
			expect(tight.result.truncated).toMatchObject({ reason: 'max_bytes' });
			expect(bytes(tight.text)).toBeLessThanOrEqual(exact - 1);
		}
	});

	test('table 一个超大单元格 + 多行：峰值字符串不超过上限的常数倍；格式化前就截断、只渲染保留的行', () => {
		const rows = [
			{ id: 0, big: 'B'.repeat(1_000_000) },
			...Array.from({ length: 200 }, (_, i) => ({ id: i + 1, big: 'x' })),
		];
		const limits = { maxRows: 10_000, maxResultBytes: 16 * 1024 };
		const peak = { length: 0 };
		const join = Array.prototype.join;
		const padEnd = String.prototype.padEnd;
		const joinSpy = vi.spyOn(Array.prototype, 'join').mockImplementation(function (
			this: unknown[],
			separator?: string,
		) {
			const out = join.call(this, separator);
			peak.length = Math.max(peak.length, out.length);
			return out;
		});
		const padSpy = vi.spyOn(String.prototype, 'padEnd').mockImplementation(function (
			this: string,
			length: number,
			fill?: string,
		) {
			const out = padEnd.call(this, length, fill);
			peak.length = Math.max(peak.length, out.length);
			return out;
		});
		let fitted: ReturnType<typeof fitSqlResultText<unknown>>;
		try {
			fitted = fitSqlResultText({ rows, limits }, formatTable, 'table');
		} finally {
			joinSpy.mockRestore();
			padSpy.mockRestore();
		}
		expect(bytes(fitted.text)).toBeLessThanOrEqual(limits.maxResultBytes);
		expect(peak.length).toBeLessThanOrEqual(4 * limits.maxResultBytes);
		expect(fitted.result.cellsTruncated).toBe(1);
		expect(fitted.text).toContain(`${'B'.repeat(255)}…`);
		// 收集器在 table 模式下只保留截断后的行，不保留原始的大字段。
		const collector = createSqlRowCollector<unknown>(limits, 'table');
		for (const row of rows) if (!collector.push(row)) break;
		expect(JSON.stringify(collector.rows).length).toBeLessThan(4 * limits.maxResultBytes);
	});

	test('极小上限：1 KiB 下限内 json 与 table 都不超限；列多到表头都放不下时 row_too_large、输出 (no results) 仍在上限内', () => {
		const limits = resolveSqlResultLimits({ maxRows: 100, maxResultBytes: 8 << 20 }, { maxResultBytes: 1 });
		const rows = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `name-${i}`.repeat(5) }));
		const json = fitSqlResultText({ rows, limits }, encodeSqlRowsJson, 'json');
		const table = fitSqlResultText({ rows, limits }, formatTable, 'table');
		expect(bytes(json.text)).toBeLessThanOrEqual(1024);
		expect(bytes(table.text)).toBeLessThanOrEqual(1024);
		const wide = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`column_${i}`, i]));
		const collector = createSqlRowCollector<unknown>(limits, 'table');
		expect(collector.push(wide)).toBe(false);
		expect(collector.truncated).toMatchObject({ reason: 'row_too_large' });
		const empty = fitSqlResultText({ rows: [wide], limits }, formatTable, 'table');
		expect(empty.text).toBe('(no results)');
		expect(empty.result.truncated).toMatchObject({ reason: 'max_bytes' });
	});

	test('json 收尾兜底：已经截断的原因保留；没超时原样返回', () => {
		const rows = SampleRows;
		const exact = bytes(encodeSqlRowsJson(rows));
		const kept = fitSqlResultText(
			{
				rows,
				truncated: { reason: 'max_rows', limits: { maxRows: 4, maxResultBytes: exact } },
				limits: { maxRows: 4, maxResultBytes: exact },
			},
			encodeSqlRowsJson,
		);
		expect(kept.result.truncated).toMatchObject({ reason: 'max_rows' });
		expect(kept.text).toBe(encodeSqlRowsJson(rows));
	});

	test('提示文案：给数字与原因、引导加 LIMIT 或聚合；单行过大引导少选或截短字段；不含 SQL', () => {
		const notice = sqlTruncationNotice({
			rows: [1, 2],
			truncated: { reason: 'max_rows', limits: { maxRows: 2, maxResultBytes: 100 } },
		});
		expect(notice).toContain('2 rows');
		expect(notice).toMatch(/LIMIT/u);
		expect(notice).toMatch(/aggregate/u);
		const oversize = sqlTruncationNotice({
			rows: [],
			truncated: { reason: 'row_too_large', limits: { maxRows: 2, maxResultBytes: 100 } },
		});
		expect(oversize).toMatch(/single row exceeds 100 bytes/u);
		expect(oversize).toMatch(/fewer or shorter columns/u);
		expect(sqlTruncationNotice({ rows: [] })).toBeUndefined();
	});
});

/**
 * 假驱动连接池：每次借出给一条连接（销毁的连接不再借出，归还的连接下次复用），记下每条连接的结局。
 * 查询按 tick 逐行吐数据；收到取消后以取消错误结束；销毁后 emit 连接关闭错误（验证监听一直挂着）。
 */
function fakePool(dialect: 'postgres' | 'mysql', rowsFor: (index: number) => unknown, totalRows: number) {
	type Conn = { id: number; state: 'idle' | 'busy' | 'released' | 'destroyed'; killed: boolean };
	const conns: Conn[] = [];
	const idle: Conn[] = [];
	const emitted = { rows: 0 };
	let nextId = 100;
	/** pg 的 `client.query(query)` 在传入的 Query 对象上 emit；mysql2 返回新的 emitter。 */
	const runQuery = (conn: Conn, sql: string, emitter: EventEmitter = new EventEmitter()) => {
		const rowEvent = dialect === 'postgres' ? 'row' : 'result';
		setImmediate(async () => {
			if (/pg_backend_pid|CONNECTION_ID/u.test(sql)) {
				emitter.emit(rowEvent, { id: conn.id });
				emitter.emit('end');
				return;
			}
			for (let i = 0; i < totalRows; i++) {
				if (conn.state === 'destroyed') {
					emitter.emit('error', new Error('Connection terminated'));
					return;
				}
				if (conn.killed) {
					emitter.emit(
						'error',
						new Error(
							dialect === 'postgres' ? 'canceling statement due to user request' : 'Query execution was interrupted',
						),
					);
					return;
				}
				emitter.emit(rowEvent, rowsFor(i));
				emitted.rows++;
				if (i % 50 === 0) await new Promise((resolve) => setImmediate(resolve));
			}
			emitter.emit('end');
		});
		return emitter;
	};
	const provide = async (): Promise<SqlRawConnection> => {
		const conn = idle.shift() ?? { id: nextId++, state: 'idle' as const, killed: false };
		if (!conns.includes(conn)) conns.push(conn);
		conn.state = 'busy';
		conn.killed = false;
		// 连接级事件（error/end）：假驱动不发，只要求能挂监听。
		const events = new EventEmitter();
		const on = (event: 'error' | 'end', listener: (...args: any[]) => void) => events.on(event, listener);
		const removeListener = (event: 'error' | 'end', listener: (...args: any[]) => void) =>
			events.removeListener(event, listener);
		if (dialect === 'postgres') {
			return {
				dialect,
				client: {
					on,
					removeListener,
					query: (query) =>
						runQuery(conn, (query as unknown as { text: string }).text, query as unknown as EventEmitter),
					release: (destroy?: boolean) => {
						if (destroy) conn.state = 'destroyed';
						else {
							conn.state = 'released';
							idle.push(conn);
						}
					},
				},
				createQuery: (text) => Object.assign(new EventEmitter(), { text }),
			} as SqlRawConnection;
		}
		return {
			dialect,
			connection: {
				on,
				removeListener,
				query: (sql: string) => runQuery(conn, sql),
				release: () => {
					conn.state = 'released';
					idle.push(conn);
				},
				destroy: () => {
					conn.state = 'destroyed';
				},
			},
		};
	};
	const cancel = vi.fn(async ({ session }: { session: number }) => {
		const conn = conns.find((item) => item.id === session);
		if (conn) conn.killed = true;
		return { outcome: 'killed' as const };
	});
	return { provide, cancel, conns, emitted };
}

const row = (i: number) => ({ i, pad: 'x'.repeat(50) });

for (const dialect of ['postgres', 'mysql'] as const) {
	describe(`executeBoundedQuery（假 ${dialect} 驱动）`, () => {
		test('没到上限：全部返回，连接归还，不取消', async () => {
			const fake = fakePool(dialect, row, 50);
			const result = await executeBoundedQuery(fake.provide, 'select * from t', {
				limits: { maxRows: 100, maxResultBytes: 1 << 20 },
				cancel: fake.cancel,
			});
			expect(result.rows).toHaveLength(50);
			expect(result.truncated).toBeUndefined();
			expect(fake.cancel).not.toHaveBeenCalled();
			expect(fake.conns.map((c) => c.state)).toEqual(['released']);
		});

		test('到行数上限：截断、用会话 ID 取消查询（不读完）、取消错误被吞掉、连接归还并被下次复用', async () => {
			const fake = fakePool(dialect, row, 1_000_000);
			const result = await executeBoundedQuery(fake.provide, 'select * from t', {
				limits: { maxRows: 1000, maxResultBytes: 1 << 20 },
				cancel: fake.cancel,
			});
			expect(result.rows).toHaveLength(1000);
			expect(result.truncated).toMatchObject({ reason: 'max_rows' });
			expect(fake.cancel).toHaveBeenCalledWith({ dialect, session: 100, sql: 'select * from t' });
			expect(fake.emitted.rows).toBeLessThan(5000);
			expect(fake.conns.map((c) => c.state)).toEqual(['released']);
			const again = await executeBoundedQuery(fake.provide, 'select * from t', {
				limits: { maxRows: 5, maxResultBytes: 1 << 20 },
				cancel: fake.cancel,
			});
			expect(again.rows).toHaveLength(5);
			expect(fake.conns).toHaveLength(1);
		});

		test('取消没生效：宽限期到了就销毁连接（不归还），下次借到的是新连接', async () => {
			const fake = fakePool(dialect, row, 1_000_000);
			const cancel = vi.fn(async () => ({ outcome: 'not_found' as const }));
			const result = await executeBoundedQuery(fake.provide, 'select * from t', {
				limits: { maxRows: 10, maxResultBytes: 1 << 20 },
				cancel,
				truncateGraceMs: 50,
			});
			expect(result.rows).toHaveLength(10);
			expect(result.truncated).toMatchObject({ reason: 'max_rows' });
			expect(fake.conns.map((c) => c.state)).toEqual(['destroyed']);
			await executeBoundedQuery(fake.provide, 'select 1', { limits: { maxRows: 10, maxResultBytes: 1 << 20 }, cancel });
			expect(fake.conns.map((c) => c.id)).toEqual([100, 101]);
		});

		test('巨大单行：立刻停止读取、销毁连接（不等取消）、返回 row_too_large，之前的行保留；连接不被复用', async () => {
			const fake = fakePool(dialect, (i) => (i < 3 ? row(i) : { i, blob: 'z'.repeat(200_000) }), 1_000_000);
			const result = await executeBoundedQuery(fake.provide, 'select * from t', {
				limits: { maxRows: 1000, maxResultBytes: 100_000 },
				cancel: fake.cancel,
			});
			expect(result.rows).toHaveLength(3);
			expect(result.truncated).toMatchObject({ reason: 'row_too_large' });
			expect(fake.emitted.rows).toBeLessThan(10);
			expect(fake.conns.map((c) => c.state)).toEqual(['destroyed']);
			// 后台照样发了取消（数据库上的查询也要停）。
			expect(fake.cancel).toHaveBeenCalledTimes(1);
			await executeBoundedQuery(fake.provide, 'select 1', { limits: { maxRows: 1, maxResultBytes: 1 << 20 } });
			expect(fake.conns.map((c) => c.id)).toEqual([100, 101]);
		});

		test('按字节上限（json 编码）：保留的部分最终输出不超过上限', async () => {
			const fake = fakePool(dialect, row, 1_000_000);
			const limits = { maxRows: 100_000, maxResultBytes: 10_000 };
			const result = await executeBoundedQuery(fake.provide, 'select * from t', {
				limits,
				encoding: 'json',
				cancel: fake.cancel,
			});
			expect(result.truncated).toMatchObject({ reason: 'max_bytes' });
			expect(bytes(encodeSqlRowsJson(result.rows))).toBeLessThanOrEqual(limits.maxResultBytes);
			expect(bytes(encodeSqlRowsJson([...result.rows, row(0)]))).toBeGreaterThan(limits.maxResultBytes);
		});

		test('调用方中止：取消查询，以 SqlQueryAbortedError 结束并回调 onCancel，连接销毁', async () => {
			const fake = fakePool(dialect, row, 1_000_000);
			const controller = new AbortController();
			const onCancel = vi.fn();
			const pending = executeBoundedQuery(fake.provide, 'select * from t', {
				limits: { maxRows: 10_000_000, maxResultBytes: 1 << 30 },
				signal: controller.signal,
				cancel: fake.cancel,
				onCancel,
			});
			// 读到数据之后再中止（不靠定时器：高负载下假驱动可能在定时器触发前就吐完了 100 万行）。
			await vi.waitFor(() => expect(fake.emitted.rows).toBeGreaterThan(0));
			controller.abort();
			await expect(pending).rejects.toBeInstanceOf(SqlQueryAbortedError);
			expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'killed', session: 100 }));
			expect(fake.conns.map((c) => c.state)).toEqual(['destroyed']);
		});
	});
}

test('非截断的数据库错误照常抛出，连接销毁', async () => {
	const events = new EventEmitter();
	const connection = {
		release: vi.fn(),
		destroy: vi.fn(),
		on: (event: 'error' | 'end', listener: (...args: any[]) => void) => events.on(event, listener),
		removeListener: (event: 'error' | 'end', listener: (...args: any[]) => void) =>
			events.removeListener(event, listener),
	};
	const provide = async (): Promise<SqlRawConnection> => ({
		dialect: 'mysql',
		connection: {
			...connection,
			query: (sql: string) => {
				const emitter = new EventEmitter();
				setImmediate(() => {
					if (sql.includes('CONNECTION_ID()')) {
						emitter.emit('result', { id: 1 });
						emitter.emit('end');
					} else emitter.emit('error', new Error('syntax error'));
				});
				return emitter;
			},
		},
	});
	await expect(
		executeBoundedQuery(provide, 'select bad', { limits: { maxRows: 10, maxResultBytes: 1024 } }),
	).rejects.toThrow('syntax error');
	expect(connection.destroy).toHaveBeenCalledTimes(1);
	expect(connection.release).not.toHaveBeenCalled();
});
