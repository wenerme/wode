import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createWocliWebCli } from './web';

function fixture() {
	const getEnv = vi.fn((name: string) => (name === 'PROM_TEST_TOKEN' ? 'PRIVATE_TOKEN' : undefined));
	const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(String(input));
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer PRIVATE_TOKEN');
		if (url.pathname.endsWith('/query'))
			return Response.json({ status: 'success', data: { resultType: 'vector', result: [{ metric: { __name__: 'up' }, value: [1700000000, '1'] }] }, warnings: [] });
		if (url.pathname.endsWith('/query_range'))
			return Response.json({ status: 'success', data: { resultType: 'matrix', result: [{ metric: { __name__: 'up' }, values: [[1700000000, '1']] }] }, warnings: [] });
		if (url.pathname.endsWith('/labels')) return Response.json({ status: 'success', data: ['__name__', 'job'], warnings: [] });
		throw new Error(`Unexpected Prometheus fixture path: ${url.pathname}`);
	});
	const config = createMemoryCliConfigStore({
		services: [{ name: 'metrics', type: 'prometheus', baseUrl: 'https://metrics.example.test', options: { accessTokenEnv: 'PROM_TEST_TOKEN' } }],
		defaults: { prometheus: 'metrics' },
	});
	const cli = createWocliWebCli({ config, getEnv, fetch: fetch as unknown as typeof globalThis.fetch });
	const lines: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (line: string) => lines.push(line) };
	return { cli, fetch, getEnv, lines, io };
}

describe('Prometheus end-to-end command adapters', () => {
	it('discovers aliases without resolving credentials or fetching', async () => {
		const { cli, fetch, getEnv, lines, io } = fixture();
		expect((await cli.describe()).some((command) => command.name === 'prometheus')).toBe(true);
		await cli.executeLine('prom --list-services --json', io);
		expect(JSON.parse(lines.at(-1)!)).toEqual([{ name: 'metrics', provider: 'prometheus', readOnly: true, default: true }]);
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('runs instant, range and label queries through the typed provider', async () => {
		const { cli, fetch, lines, io } = fixture();
		await cli.executeLine('prom query up --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ data: { resultType: 'vector' } });
		await cli.executeLine('prom range up --start 1700000000 --end 1700000060 --step 60 --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ data: { resultType: 'matrix' } });
		const rangeRequest = new URL(String(fetch.mock.calls[1]?.[0]));
		expect(rangeRequest.searchParams.get('start')).toBe('1700000000');
		expect(rangeRequest.searchParams.get('end')).toBe('1700000060');
		expect(rangeRequest.searchParams.get('step')).toBe('60');
		await cli.executeLine('prom labels --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ data: ['__name__', 'job'] });
		const requests = fetch.mock.calls.map(([input]) => new URL(String(input)));
		expect(requests.map((request) => request.pathname)).toEqual(['/api/v1/query', '/api/v1/query_range', '/api/v1/labels']);
	});
});
