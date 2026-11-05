import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createWebCli } from './web';

function fixture() {
	const getEnv = vi.fn((name: string) => (name === 'PROM_TEST_TOKEN' ? 'PRIVATE_TOKEN' : undefined));
	const readText = vi.fn(async (_value: string, _options: { signal: AbortSignal; maxBytes: number }) => {
		expect(getEnv).not.toHaveBeenCalled();
		return '  sum(up)\n';
	});
	const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(String(input));
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer PRIVATE_TOKEN');
		if (url.pathname.endsWith('/query'))
			return Response.json({ status: 'success', data: { resultType: 'vector', result: [{ metric: { __name__: 'up' }, value: [1700000000, '1'] }] }, warnings: [] });
		if (url.pathname.endsWith('/query_range'))
			return Response.json({ status: 'success', data: { resultType: 'matrix', result: [{ metric: { __name__: 'up' }, values: [[1700000000, '1']] }] }, warnings: [] });
		if (url.pathname.endsWith('/labels')) return Response.json({ status: 'success', data: ['__name__', 'job'], warnings: [] });
		if (url.pathname.endsWith('/series')) return Response.json({ status: 'success', data: [{ __name__: 'up', job: 'api' }], warnings: [] });
		if (url.pathname.endsWith('/label/job/values')) return Response.json({ status: 'success', data: ['api'], warnings: [] });
		if (url.pathname.endsWith('/metadata')) return Response.json({ status: 'success', data: { up: [{ type: 'gauge', help: 'Target health', unit: '' }] }, warnings: [] });
		throw new Error(`Unexpected Prometheus fixture path: ${url.pathname}`);
	});
	const config = createMemoryCliConfigStore({
		services: [{ name: 'metrics', type: 'prometheus', baseUrl: 'https://metrics.example.test', options: { accessTokenEnv: 'PROM_TEST_TOKEN' } }],
		defaults: { prometheus: 'metrics' },
	});
	const cli = createWebCli({ config, getEnv, readText, fetch: fetch as unknown as typeof globalThis.fetch });
	const lines: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (line: string) => lines.push(line) };
	return { cli, fetch, getEnv, readText, lines, io };
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

	it.each(['query', 'q', 'query-range', 'range'])('runs %s with an inline --query', async (command) => {
		const f = fixture();
		await f.cli.execute(['prom', command, '--query', 'sum(up)', '--json'], f.io);
		expect(new URL(String(f.fetch.mock.calls[0]?.[0])).searchParams.get('query')).toBe('sum(up)');
		expect(f.readText).not.toHaveBeenCalled();
		expect(JSON.parse(f.lines.at(-1)!)).toMatchObject({ status: 'success', data: { resultType: command === 'query' || command === 'q' ? 'vector' : 'matrix' } });
	});

	it.each([
		['query', '@query.promql'], ['q', '-'], ['query-range', '@query.promql'], ['range', '-'],
	])('reads %s --query %s before credentials', async (command, source) => {
		const f = fixture();
		await f.cli.execute(['prom', command, '--query', source, '--json'], f.io);
		expect(f.readText).toHaveBeenCalledExactlyOnceWith(source, { signal: f.io.signal, maxBytes: 16 * 1024 * 1024 });
		expect(new URL(String(f.fetch.mock.calls[0]?.[0])).searchParams.get('query')).toBe('sum(up)');
	});

	it.each(['series', 'labels', 'label-values', 'values'])('preserves repeated match[] for %s', async (command) => {
		const f = fixture();
		const label = command === 'label-values' || command === 'values' ? ['job'] : [];
		await f.cli.execute(['prom', command, ...label, '--match', 'up{job="api"}', '--match', 'process_cpu_seconds_total', '--start', '1700000000', '--end', '1700000060', '--json'], f.io);
		const request = new URL(String(f.fetch.mock.calls[0]?.[0]));
		expect(request.pathname).toBe(`/api/v1/${label.length ? 'label/job/values' : command}`);
		expect(request.searchParams.getAll('match[]')).toEqual(['up{job="api"}', 'process_cpu_seconds_total']);
		expect(request.searchParams.get('start')).toBe('1700000000');
		expect(request.searchParams.get('end')).toBe('1700000060');
		expect(JSON.parse(f.lines.at(-1)!)).toMatchObject({ status: 'success', data: command === 'series' ? [{ __name__: 'up', job: 'api' }] : label.length ? ['api'] : ['__name__', 'job'] });
	});

	it('passes metadata filters and preserves its JSON response', async () => {
		const f = fixture();
		await f.cli.executeLine('prom metadata --metric up --limit 2 --json', f.io);
		const request = new URL(String(f.fetch.mock.calls[0]?.[0]));
		expect(request.pathname).toBe('/api/v1/metadata');
		expect(request.searchParams.get('metric')).toBe('up');
		expect(request.searchParams.get('limit')).toBe('2');
		expect(JSON.parse(f.lines.at(-1)!)).toEqual({ status: 'success', data: { up: [{ type: 'gauge', help: 'Target health', unit: '' }] }, warnings: [] });
	});

	it.each(['query', 'range'])('keeps %s help offline even with an input source', async (command) => {
		const f = fixture();
		await f.cli.execute(['prom', command, '--query', '@never-read.promql', '--help'], f.io);
		expect(f.lines.join('\n')).toContain('--query');
		expect(f.lines.join('\n')).toContain('@file');
		expect(f.readText).not.toHaveBeenCalled();
		expect(f.getEnv).not.toHaveBeenCalled();
		expect(f.fetch).not.toHaveBeenCalled();
	});

	it.each([
		['query'], ['range'], ['query', '--query', ''], ['range', '--query', '  '],
		['query', 'up', '--query', '@never-read.promql'], ['range', 'up', '--query', '-'],
		['query', '--query', '@never-read.promql', '--time', 'invalid'],
		['range', '--query', '-', '--start', 'invalid'],
		['range', '--query', '@never-read.promql', '--end', 'invalid'],
		['range', '--query', '-', '--step', '0'],
		['query', '--query', '-', '--timeout', ''],
		['query', 'up', '--time', 'invalid'], ['range', 'up', '--step', 'bad'],
		['series'], ['series', '--match', ''], ['labels', '--start', 'invalid'],
		['values', 'job', '--end', 'invalid'], ['metadata', '--limit', '0'],
	])('rejects invalid argv %j before input, credentials or HTTP', async (...argv) => {
		const f = fixture();
		await expect(f.cli.execute(['prom', ...argv], f.io)).rejects.toThrow();
		expect(f.readText).not.toHaveBeenCalled();
		expect(f.getEnv).not.toHaveBeenCalled();
		expect(f.fetch).not.toHaveBeenCalled();
	});

	it.each(['query', 'range'])('rejects empty %s input before credentials', async (command) => {
		const f = fixture();
		f.readText.mockResolvedValue(' \n');
		await expect(f.cli.execute(['prom', command, '--query', '-'], f.io)).rejects.toThrow('query is required');
		expect(f.readText).toHaveBeenCalledOnce();
		expect(f.getEnv).not.toHaveBeenCalled();
		expect(f.fetch).not.toHaveBeenCalled();
	});

	it('enforces the standard host input size limit before credentials', async () => {
		const f = fixture();
		f.readText.mockResolvedValue('x'.repeat(16 * 1024 * 1024 + 1));
		await expect(f.cli.executeLine('prom query --query @large.promql', f.io)).rejects.toThrow('size limit');
		expect(f.getEnv).not.toHaveBeenCalled();
		expect(f.fetch).not.toHaveBeenCalled();
	});
});
