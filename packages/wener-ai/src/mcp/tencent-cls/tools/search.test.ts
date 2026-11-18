import { describe, expect, it } from 'vitest';
import { createProjectionStats, DEFAULT_MAX_FIELD_CHARS, projectLog, truncateText } from '../projection';
import { ClusterLogsInputSchema, LogContextInputSchema, SearchInputSchema } from '../schemas';
import type { TencentClsContext } from '../server';
import { registerSearchTools } from './search';

// 网关日志的 request_body 单字段可达 ~50KB，limit=200 的一次 search 约 15MB，
// 超过 MCP 客户端响应上限后整次调用失败。下面用同形状的数据验证服务端截断与投影。

type Handler = (args: any) => Promise<{ content: { type: 'text'; text: string }[] }>;

function setup(client: Record<string, (req: any) => Promise<any>>) {
	const handlers = new Map<string, Handler>();
	const schemas = new Map<string, { parse: (v: unknown) => any }>([
		['search', SearchInputSchema],
		['log_context', LogContextInputSchema],
		['cluster_logs', ClusterLogsInputSchema],
	]);
	const requests: any[] = [];
	const ctx = {
		server: {
			registerTool(name: string, _def: unknown, handler: Handler) {
				handlers.set(name, handler);
			},
		},
		getClient: () => ({
			resolveTopicIds: async (topics: string[]) => topics,
			...Object.fromEntries(
				Object.entries(client).map(([k, fn]) => [
					k,
					async (req: any) => {
						requests.push(req);
						return fn(req);
					},
				]),
			),
		}),
		textResult: (text: string) => ({ content: [{ type: 'text' as const, text }] }),
		jsonResult: (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] }),
	} as unknown as TencentClsContext;
	registerSearchTools(ctx);
	return {
		requests,
		async call(name: string, args: Record<string, unknown>) {
			// 与 MCP SDK 一致：先按 inputSchema 解析（套用默认值），再调用 handler
			const schema = schemas.get(name);
			const handler = handlers.get(name);
			if (!schema || !handler) throw new Error(`tool not registered: ${name}`);
			const res = await handler(schema.parse(args));
			const text = res.content[0]?.text ?? '';
			return {
				text,
				json: (() => {
					try {
						return JSON.parse(text);
					} catch {
						return undefined;
					}
				})(),
			};
		},
	};
}

const BIG = 'x'.repeat(50_000);

function gatewayLogs(n: number) {
	return Array.from({ length: n }, (_, i) => ({
		Time: 1_792_740_000_000 + i,
		TopicName: 'gateway-logs',
		PkgId: `pkg-${i}`,
		PkgLogId: i + 1,
		LogJson: JSON.stringify({ msg: `request ${i}`, trace_id: `t-${i}`, request_body: `${i}:${BIG}` }),
	}));
}

describe('tencent-cls search 字段截断与投影', () => {
	it('默认截断超长字段，200 条网关日志从 ~10MB 降到 <1MB，且保留游标与元数据', async () => {
		const { call } = setup({
			searchLog: async () => ({ Results: gatewayLogs(200), ListOver: false, Context: 'cursor-2' }),
		});
		const { text, json } = await call('search', { topic: 'gateway-logs', limit: 200 });

		expect(Buffer.byteLength(text)).toBeLessThan(1024 * 1024);
		expect(json.count).toBe(200);
		expect(json.cursor).toBe('cursor-2');
		const first = json.logs[0];
		expect(first._pkgId).toBe('pkg-0');
		expect(first.msg).toBe('request 0');
		expect(first.request_body.length).toBeLessThan(DEFAULT_MAX_FIELD_CHARS + 80);
		expect(first.request_body).toContain('[truncated 48002 of 50002 chars]');
		expect(json.truncated.fields).toEqual({ request_body: 200 });
		expect(json.truncated.maxOriginalChars).toBe(50_004); // "199:" + 50000
		expect(json.truncated.hint).toContain('maxFieldChars: 0');
	});

	it('fields 只返回指定字段（元数据始终保留）', async () => {
		const { json } = await setupAndCall({ fields: ['msg'] });
		expect(Object.keys(json.logs[0]).sort()).toEqual(['_pkgId', '_pkgLogId', '_time', '_topic', 'msg']);
		expect(json.truncated).toBeUndefined();
	});

	it('maxFieldChars: 0 返回完整内容，便于按 trace_id 取原文', async () => {
		const { json } = await setupAndCall({ maxFieldChars: 0 });
		expect(json.logs[0].request_body).toBe(`0:${BIG}`);
		expect(json.truncated).toBeUndefined();
	});

	it.each([0, 4])('特殊字段名在 search JSON 中完整保留，maxFieldChars=%s', async (maxFieldChars) => {
		const names = ['constructor', 'toString', '__proto__'];
		const { call } = setup({
			searchLog: async () => ({
				Results: [0, 1].map((i) => ({
					Time: i + 1,
					LogJson: JSON.stringify(Object.fromEntries(names.map((name) => [name, `${i}:${BIG}`]))),
				})),
				ListOver: true,
			}),
		});
		const { json } = await call('search', { topic: 't', fields: names, maxFieldChars });
		for (const [i, log] of json.logs.entries()) {
			for (const name of names) {
				expect(Object.hasOwn(log, name)).toBe(true);
				expect(log[name]).toBe(truncateText(`${i}:${BIG}`, maxFieldChars));
			}
		}
		if (maxFieldChars === 0) {
			expect(json.truncated).toBeUndefined();
		} else {
			expect(json.truncated.fields).toEqual(Object.fromEntries(names.map((name) => [name, 2])));
		}
	});

	it('没有超长字段时输出与原来一致（无 truncated 键）', async () => {
		const { call } = setup({
			searchLog: async () => ({
				Results: [{ Time: 1, PkgId: 'p', PkgLogId: 1, LogJson: JSON.stringify({ msg: 'short' }) }],
				ListOver: true,
			}),
		});
		const { json } = await call('search', { topic: 't' });
		expect(json.logs[0].msg).toBe('short');
		expect('truncated' in json).toBe(false);
	});

	it('所有日志相同的大字段被提为 common 时也已截断', async () => {
		const { call } = setup({
			searchLog: async () => ({
				Results: [1, 2].map((i) => ({ Time: i, PkgId: `p${i}`, PkgLogId: i, LogJson: JSON.stringify({ body: BIG }) })),
				ListOver: true,
			}),
		});
		const { json } = await call('search', { topic: 't' });
		expect(json.common.body.length).toBeLessThan(DEFAULT_MAX_FIELD_CHARS + 80);
	});

	it('SQL 分析查询（含 |）不受影响', async () => {
		const { call } = setup({
			searchLog: async () => ({ AnalysisRecords: [JSON.stringify({ c: 3 })], Columns: [{ Name: 'c' }] }),
		});
		const { json } = await call('search', { topic: 't', query: '* | select count(*) as c' });
		expect(json).toMatchObject({ analysis: true, records: [{ c: 3 }] });
	});

	it('log_context 同样截断', async () => {
		const { call } = setup({
			describeLogContext: async () => ({
				LogContextInfos: [{ BTime: 1, PkgId: 'p', PkgLogId: 1, Content: JSON.stringify({ request_body: BIG }) }],
				PrevOver: true,
				NextOver: true,
			}),
		});
		const { json } = await call('log_context', { topic: 't', time: '1792740000000', pkgId: 'p', pkgLogId: 1 });
		expect(json.logs[0].request_body.length).toBeLessThan(DEFAULT_MAX_FIELD_CHARS + 80);
		expect(json.truncated.fields).toEqual({ request_body: 1 });
	});

	it('cluster_logs 的 sample 截断', async () => {
		const { call } = setup({
			searchLog: async () => ({
				Results: [1, 2, 3].map((i) => ({ Time: i, LogJson: JSON.stringify({ msg: `${BIG} ${i}` }) })),
			}),
		});
		const { json } = await call('cluster_logs', { topic: 't' });
		for (const c of json.clusters) {
			expect(c.sample.length).toBeLessThan(DEFAULT_MAX_FIELD_CHARS + 80);
		}
	});

	async function setupAndCall(extra: Record<string, unknown>) {
		const { call } = setup({ searchLog: async () => ({ Results: gatewayLogs(2), ListOver: true }) });
		return call('search', { topic: 'gateway-logs', ...extra });
	}
});

describe('projection 单元', () => {
	it.each([0, 100])('特殊字段名与对象值原样保留，maxFieldChars=%s', (maxFieldChars) => {
		const log = JSON.parse('{"constructor":"ctor","toString":"str","__proto__":{"safe":true}}');
		const stats = createProjectionStats();
		const out = projectLog(log, { maxFieldChars }, stats);
		expect(Object.keys(out)).toEqual(Object.keys(log));
		for (const key of Object.keys(log)) {
			expect(Object.hasOwn(out, key)).toBe(true);
			expect(out[key]).toBe(log[key]);
		}
		expect(JSON.stringify(out)).toBe(JSON.stringify(log));
		expect(Object.keys(stats.truncatedFields)).toEqual([]);
		expect(stats.maxOriginalChars).toBe(0);
	});

	it('特殊字段名的截断计数从 0 开始，按条累加，且不修改原日志', () => {
		const names = ['constructor', 'toString', '__proto__'];
		const log = Object.fromEntries(names.map((name) => [name, BIG]));
		const stats = createProjectionStats();
		for (const count of [1, 2]) {
			const out = projectLog(log, { fields: names, maxFieldChars: 4 }, stats);
			for (const name of names) {
				expect(Object.hasOwn(out, name)).toBe(true);
				expect(out[name]).toBe(truncateText(BIG, 4));
				expect(Object.hasOwn(stats.truncatedFields, name)).toBe(true);
				expect(stats.truncatedFields[name]).toBe(count);
				expect(log[name]).toBe(BIG);
			}
		}
		expect(stats.maxOriginalChars).toBe(BIG.length);
	});

	it('truncateText 不改短字符串，长字符串注明省略字数', () => {
		expect(truncateText('abc', 5)).toBe('abc');
		expect(truncateText('abcdef', 0)).toBe('abcdef');
		expect(truncateText('abcdef', 2)).toBe('ab…[truncated 4 of 6 chars]');
	});

	it('对象字段超长时按 JSON 文本截断', () => {
		const stats = createProjectionStats();
		const out = projectLog({ nested: { body: BIG } }, { maxFieldChars: 100 }, stats);
		expect(typeof out.nested).toBe('string');
		expect(String(out.nested).startsWith('{"body":"xxx')).toBe(true);
		expect(stats.truncatedFields).toEqual({ nested: 1 });
	});
});
