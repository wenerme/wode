import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { McpServer } from '@modelcontextprotocol/server';
import { describe, expect, test, vi } from 'vitest';
import { SqlQueryAbortedError } from '../cancellableQuery';
import type { SqlContext } from '../server';
import { registerQueryTools } from './query';

type ToolHandler = (input: { sql: string }, extra: { mcpReq: { signal: AbortSignal } }) => Promise<unknown>;

function setup(runQuery: SqlContext['runQuery']) {
	const handlers = new Map<string, ToolHandler>();
	const server = {
		registerTool: (name: string, _config: unknown, handler: ToolHandler) => handlers.set(name, handler),
	};
	const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
	registerQueryTools({
		server,
		readOnly: true,
		runQuery,
		textResult,
		jsonResult: (value: unknown) => textResult(JSON.stringify(value)),
	} as unknown as SqlContext);
	const invoke = async (tool: 'query_json' | 'exec_query') => {
		const handler = handlers.get(tool);
		if (!handler) throw new Error(`missing ${tool}`);
		return handler({ sql: 'select 1' }, { mcpReq: { signal: new AbortController().signal } });
	};
	return { invoke };
}

async function invokeMcpWire(error: unknown) {
	const server = new McpServer({ name: 'sql-test', version: '1.0.0' });
	const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
	registerQueryTools({
		server,
		readOnly: true,
		runQuery: vi.fn().mockRejectedValue(error),
		textResult,
		jsonResult: (value: unknown) => textResult(JSON.stringify(value)),
	} as unknown as SqlContext);
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	await server.connect(serverTransport);
	const client = new Client({ name: 'sql-test-client', version: '1.0.0' });
	await client.connect(clientTransport);
	try {
		return await client.callTool({ name: 'exec_query', arguments: { sql: 'select 1' } });
	} finally {
		await client.close();
		await server.close();
	}
}

describe('SQL MCP 查询失败合同', () => {
	test('真实 MCP transport 保留 isError 与 structuredContent', async () => {
		const result = await invokeMcpWire(new Error('private connection detail'));
		expect(result).toMatchObject({
			isError: true,
			structuredContent: { error: { code: 'unknown', retryable: null } },
		});
		expect(JSON.stringify(result)).not.toContain('private connection detail');
	});

	test.each([
		['PostgreSQL SQLSTATE 22023', Object.assign(new Error('private parameter'), { code: '22023' })],
		[
			'MySQL 1210/ER_WRONG_ARGUMENTS',
			Object.assign(new Error('private parameter'), { errno: 1210, code: 'ER_WRONG_ARGUMENTS' }),
		],
	] as const)('%s 参数错误在 MCP wire 上标记 invalid_query', async (_name, error) => {
		const result = await invokeMcpWire(error);
		expect(result).toMatchObject({
			isError: true,
			structuredContent: { error: { code: 'invalid_query', retryable: false } },
		});
		expect(JSON.stringify(result)).not.toContain('private parameter');
	});

	test.each([
		['PostgreSQL division_by_zero', Object.assign(new Error('division by zero'), { code: '22012' })],
		[
			'MySQL mismatched code',
			Object.assign(new Error('not a parameter code'), { errno: 1210, code: 'ER_UNKNOWN_ERROR' }),
		],
	] as const)('%s 不误判为参数错误', async (_name, error) => {
		expect(await invokeMcpWire(error)).toMatchObject({
			isError: true,
			structuredContent: { error: { code: 'unknown', retryable: null } },
		});
	});

	test.each(['query_json', 'exec_query'] as const)('%s 抛错时返回 MCP isError 与结构化 unknown', async (tool) => {
		const { invoke } = setup(vi.fn().mockRejectedValue(new Error('password=secret; BE unavailable')));
		expect(await invoke(tool)).toEqual({
			isError: true,
			// 宿主没注入摘要函数：`<code>: <固定文案>`，不回显驱动原文。
			content: [{ type: 'text', text: 'unknown: SQL query failed; inspect the server trace for details.' }],
			structuredContent: { error: { code: 'unknown', retryable: null } },
		});
	});

	test('调用方取消有稳定类别，不算后端失败', async () => {
		const error = new SqlQueryAbortedError({ outcome: 'killed', session: 1, durationMs: 2 });
		const { invoke } = setup(vi.fn().mockRejectedValue(error));
		expect(await invoke('exec_query')).toMatchObject({
			isError: true,
			structuredContent: { error: { code: 'query_cancelled', retryable: false } },
		});
	});

	test('执行前已中止的请求按调用方取消分类', async () => {
		const controller = new AbortController();
		controller.abort(new Error('private reason'));
		const handlers = new Map<string, ToolHandler>();
		const server = {
			registerTool: (name: string, _config: unknown, handler: ToolHandler) => handlers.set(name, handler),
		};
		const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
		registerQueryTools({
			server,
			readOnly: true,
			runQuery: vi.fn().mockRejectedValue(controller.signal.reason),
			textResult,
			jsonResult: (value: unknown) => textResult(JSON.stringify(value)),
		} as unknown as SqlContext);
		const handler = handlers.get('exec_query');
		if (!handler) throw new Error('missing exec_query');
		const result = await handler({ sql: 'select 1' }, { mcpReq: { signal: controller.signal } });
		expect(result).toMatchObject({
			isError: true,
			structuredContent: { error: { code: 'query_cancelled', retryable: false } },
		});
		expect(JSON.stringify(result)).not.toContain('private reason');
	});

	test('仅 MySQL 协议确定的语法错误归 invalid_query', async () => {
		const error = Object.assign(new Error('unsafe SQL text'), { errno: 1064, code: 'ER_PARSE_ERROR' });
		const { invoke } = setup(vi.fn().mockRejectedValue(error));
		expect(await invoke('query_json')).toMatchObject({
			isError: true,
			structuredContent: { error: { code: 'invalid_query', retryable: false } },
		});
	});

	test('PostgreSQL SQLSTATE 42601 语法错误归 invalid_query', async () => {
		const error = Object.assign(new Error('unsafe SQL text'), { code: '42601' });
		const { invoke } = setup(vi.fn().mockRejectedValue(error));
		expect(await invoke('query_json')).toMatchObject({
			isError: true,
			structuredContent: { error: { code: 'invalid_query', retryable: false } },
		});
	});

	test('Doris 通用 1105 即使消息含 BE unavailable 仍归 unknown', async () => {
		const error = Object.assign(new Error('BE unavailable'), { errno: 1105, code: 'ER_UNKNOWN_ERROR' });
		const { invoke } = setup(vi.fn().mockRejectedValue(error));
		expect(await invoke('exec_query')).toMatchObject({
			isError: true,
			structuredContent: { error: { code: 'unknown', retryable: null } },
		});
	});

	test('正常结果中的 Error 和 unavailable 文本，以及空结果，都保持成功', async () => {
		const runQuery = vi
			.fn()
			.mockResolvedValueOnce({ rows: [{ value: 'Error: BE unavailable' }] })
			.mockResolvedValueOnce({ rows: [] });
		const { invoke } = setup(runQuery);
		expect(await invoke('exec_query')).toMatchObject({
			content: [{ type: 'text', text: expect.stringContaining('Error: BE unavailable') }],
		});
		expect(await invoke('exec_query')).toEqual({ content: [{ type: 'text', text: '(no results)' }] });
	});

	describe('宿主注入摘要函数（返回脱敏后的驱动原文）', () => {
		function setupWithDescriber(
			runQuery: SqlContext['runQuery'],
			describeQueryError: (error: unknown) => string | undefined,
		) {
			const handlers = new Map<string, ToolHandler>();
			const server = {
				registerTool: (name: string, _config: unknown, handler: ToolHandler) => handlers.set(name, handler),
			};
			const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
			registerQueryTools({
				server,
				readOnly: false,
				runQuery,
				getDb: async () => {
					throw Object.assign(new Error('raw driver detail with password=hunter2'), { code: 'ER_ACCESS_DENIED_ERROR' });
				},
				textResult,
				jsonResult: (value: unknown) => textResult(JSON.stringify(value)),
				describeQueryError,
			} as unknown as SqlContext);
			return (tool: string, signal = new AbortController().signal) =>
				handlers.get(tool)!({ sql: 'select 1' }, { mcpReq: { signal } });
		}
		const describe = (error: unknown) => `described(${error instanceof Error ? error.message : String(error)})`;

		test('查询工具：`<code>: <摘要>`，code/retryable 不变', async () => {
			const syntax = Object.assign(new Error('syntax error at or near "selec"'), { code: '42601' });
			const invoke = setupWithDescriber(vi.fn().mockRejectedValue(syntax), describe);
			expect(await invoke('exec_query')).toEqual({
				isError: true,
				content: [{ type: 'text', text: 'invalid_query: described(syntax error at or near "selec")' }],
				structuredContent: { error: { code: 'invalid_query', retryable: false } },
			});
			const other = setupWithDescriber(vi.fn().mockRejectedValue(new Error('BE unavailable')), describe);
			expect(await other('query_json')).toMatchObject({
				content: [{ type: 'text', text: 'unknown: described(BE unavailable)' }],
				structuredContent: { error: { code: 'unknown', retryable: null } },
			});
		});

		test('调用方取消不透出原文（固定文案）', async () => {
			const error = new SqlQueryAbortedError({ outcome: 'killed', session: 1, durationMs: 2 });
			const invoke = setupWithDescriber(vi.fn().mockRejectedValue(error), describe);
			expect(await invoke('exec_query')).toMatchObject({
				content: [{ type: 'text', text: 'query_cancelled: SQL query was cancelled by the caller.' }],
			});
		});

		test.each([
			['返回 undefined', (): undefined => undefined],
			['返回空串', (): string => ''],
			[
				'抛错',
				(): never => {
					throw new Error('describer failed');
				},
			],
		] as const)('摘要函数%s：回到固定文案，不回显原文', async (_label, describer) => {
			const invoke = setupWithDescriber(vi.fn().mockRejectedValue(new Error('password=hunter2')), describer);
			const result = await invoke('exec_query');
			expect(result).toMatchObject({
				content: [{ type: 'text', text: 'unknown: SQL query failed; inspect the server trace for details.' }],
			});
			expect(JSON.stringify(result)).not.toContain('hunter2');
		});

		test.each(['exec_dml', 'exec_ddl', 'exec_sql'] as const)(
			'%s（可写工具）：有摘要时用摘要，不回显原文',
			async (tool) => {
				const invoke = setupWithDescriber(vi.fn(), describe);
				const result = await invoke(tool);
				expect(result).toEqual({
					content: [{ type: 'text', text: 'Error: described(raw driver detail with password=hunter2)' }],
				});
			},
		);
	});
});
