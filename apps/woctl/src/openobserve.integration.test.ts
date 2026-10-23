import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createWocliWebCli } from './web';

function fixture() {
	const getEnv = vi.fn((name: string) => (name === 'OO_TEST_TOKEN' ? 'PRIVATE_TOKEN' : undefined));
	const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(String(input));
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer PRIVATE_TOKEN');
		if (url.pathname.endsWith('/healthz')) return Response.json({ status: 'ok' });
		if (url.pathname.endsWith('/streams'))
			return Response.json({
				list: [
					{
						name: 'app',
						stream_type: url.searchParams.get('type'),
						stats: { doc_num: 5, storage_size: 20 },
						schema: [{ name: 'message', type: 'Utf8' }],
					},
				],
				total: 1,
			});
		if (url.pathname.endsWith('/schema'))
			return Response.json({ schema: [{ name: 'message', type: 'Utf8' }], total_fields: 1 });
		if (url.pathname.endsWith('/_search'))
			return Response.json({
				hits: [{ _timestamp: 1, message: 'ok', access_token: 'PRIVATE_DATA' }],
				total: 1,
				took: 2,
				from: 0,
				size: 1,
			});
		if (url.pathname.endsWith('/traces/latest'))
			return Response.json({ hits: [{ trace_id: 'fixture-trace' }], total: 1, from: 0, size: 1 });
		throw new Error('Unexpected fixture endpoint');
	});
	const config = createMemoryCliConfigStore({
		services: [
			{
				name: 'observe',
				type: 'oo',
				baseUrl: 'https://observe.example.test/prefix',
				options: { organization: 'tenant', accessTokenEnv: 'OO_TEST_TOKEN' },
			},
		],
		defaults: { openobserve: 'observe' },
	});
	const cli = createWocliWebCli({ config, getEnv, fetch: fetch as unknown as typeof globalThis.fetch });
	const lines: string[] = [];
	const io = {
		signal: new AbortController().signal,
		stdout: (line: string) => {
			lines.push(line);
		},
	};
	return { cli, fetch, getEnv, lines, io };
}
describe('OpenObserve end-to-end command adapters', () => {
	it('discovers provider aliases and lists services without resolving credentials or fetching', async () => {
		const { cli, fetch, getEnv, lines, io } = fixture();
		expect((await cli.describe()).some((command) => command.name === 'openobserve')).toBe(true);
		await cli.executeLine('oo --help', io);
		await cli.executeLine('oo --list-services --json', io);
		expect(JSON.parse(lines.at(-1)!)).toEqual([
			{ name: 'observe', provider: 'openobserve', readOnly: true, default: true },
		]);
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
	it('runs status, stream discovery, schema, generated queries and traces through the same provider', async () => {
		const { cli, fetch, lines, io } = fixture();
		await cli.executeLine('oo status --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ reachable: true });
		await cli.executeLine('oo stream ls --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ streams: [{ name: 'app' }] });
		await cli.executeLine('oo stream schema --stream app --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ fields: [{ name: 'message' }] });
		await cli.executeLine('oo q --stream app --text error --size 1 --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ hits: [{ message: 'ok', access_token: '<redacted>' }] });
		const request = fetch.mock.calls.find(([url]) => String(url).includes('/_search'))!;
		expect(JSON.parse(String(request[1]?.body)).query.sql).toBe(
			`SELECT * FROM "app" WHERE match_all('error') ORDER BY _timestamp DESC`,
		);
		await cli.executeLine('oo trace ls --stream app --size 1 --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ traces: [{ trace_id: 'fixture-trace' }] });
	});
	it('rejects invalid prepare inputs before credentials and HTTP', async () => {
		const { cli, fetch, getEnv, io } = fixture();
		await expect(cli.executeLine('oo q --stream app --from invalid', io)).rejects.toThrow('time range');
		await expect(cli.executeLine('oo trace ls', io)).rejects.toThrow('stream');
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
});
