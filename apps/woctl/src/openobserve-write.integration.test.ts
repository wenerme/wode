import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createWocliWebCli } from './web';

function fixture(readOnly = false) {
	const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(String(input));
		if (url.pathname.endsWith('/schema')) return Response.json({ schema: [], settings: { data_retention: 7 } });
		if (url.pathname.endsWith('/_json') || url.pathname.endsWith('/_multi')) return Response.json({ code: 200, status: [{ name: 'app', successful: 1, failed: 0 }] });
		if (url.pathname.endsWith('/settings') || init?.method === 'DELETE') return Response.json({ code: 200, message: 'accepted' });
		if (url.pathname.endsWith('/_values')) return Response.json({ hits: [{ field: 'service', values: [{ zo_sql_key: 'api', zo_sql_num: 1 }] }], total: 1 });
		if (url.pathname.endsWith('/_around')) return Response.json({ hits: [{ message: 'neighbor' }], total: 1, from: 0, size: 0 });
		if (url.pathname.endsWith('/_search')) return Response.json({ hits: [{ password: 'FIXTURE_PASSWORD', message: '{"api_key":"FIXTURE_KEY"}' }], total: 1, from: 0, size: 1 });
		throw new Error('Unexpected fixture endpoint');
	});
	const getEnv = vi.fn(() => 'FIXTURE_TOKEN');
	const readText = vi.fn(async () => '{"message":"fixture"}\n');
	const config = createMemoryCliConfigStore({ services: [{ name: 'observe', type: 'oo', readOnly, baseUrl: 'https://observe.example.test', options: { accessTokenEnv: 'OO_FIXTURE_TOKEN' } }] });
	const cli = createWocliWebCli({ config, getEnv, readText, fetch: fetch as unknown as typeof globalThis.fetch });
	const lines: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (line: string) => { lines.push(line); } };
	return { cli, fetch, getEnv, readText, lines, io };
}
describe('OpenObserve extended operations', () => {
	it.each(['toString', 'constructor', '__proto__'])('rejects inherited tool name %s before consuming input', async (tool) => {
		const { cli, readText, getEnv, fetch, io } = fixture();
		await expect(cli.execute(['service', 'call', 'observe', tool, '--input', '-', '--yes'], io)).rejects.toThrow('Unknown service operation');
		expect(readText).not.toHaveBeenCalled();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
	it('requires generic write confirmation before files or credentials', async () => {
		const writable = fixture();
		await expect(writable.cli.executeLine('service call observe deleteStream --input @request.json', writable.io)).rejects.toThrow('--yes');
		expect(writable.readText).not.toHaveBeenCalled();
		expect(writable.getEnv).not.toHaveBeenCalled();
		expect(writable.fetch).not.toHaveBeenCalled();
		await writable.cli.execute(['service', 'call', 'observe', 'deleteStream', '--input', '{"stream":"app"}', '--yes', '--json'], writable.io);
		expect(writable.fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
		const readonly = fixture(true);
		await expect(readonly.cli.executeLine('service call observe deleteStream --input @request.json --yes', readonly.io)).rejects.toThrow('read-only');
		expect(readonly.readText).not.toHaveBeenCalled();
		expect(readonly.getEnv).not.toHaveBeenCalled();
		expect(readonly.fetch).not.toHaveBeenCalled();
	});
	it('applies redaction to generic CLI results too', async () => {
		const { cli, lines, io } = fixture(true);
		await cli.execute(['service', 'call', 'observe', 'search', '--input', '{"sql":"SELECT 1","startTimeMicros":1,"endTimeMicros":2,"size":1}', '--json'], io);
		const result = JSON.parse(lines.at(-1)!);
		expect(result.hits[0].password).toBe('<redacted>');
		expect(JSON.parse(result.hits[0].message)).toEqual({ api_key: '<redacted>' });
	});
	it('validates settings semantics before resolving credentials', async () => {
		const { cli, fetch, getEnv, io } = fixture();
		await expect(cli.execute(['oo', 'stream', 'update', 'app', '--input', '{"data_retention":1}', '--yes'], io)).rejects.toThrow('settings');
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
	it('reads settings, distinct values and around results', async () => {
		const { cli, lines, io } = fixture(true);
		await cli.executeLine('oo stream settings app --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ settings: { data_retention: 7 } });
		await cli.executeLine('oo values service --stream app --size 1 --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ hits: [{ field: 'service' }] });
		await cli.executeLine('oo around 1000 --stream app --size 1 --json', io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ hits: [{ message: 'neighbor' }] });
	});
	it('serializes confirmed JSON/NDJSON writes and stream mutations', async () => {
		const { cli, fetch, readText, lines, io } = fixture();
		await cli.execute(['oo', 'ingest', 'json', '[{"message":"fixture"}]', '--stream', 'app', '--yes', '--json'], io);
		expect(JSON.parse(lines.at(-1)!)).toMatchObject({ status: [{ successful: 1, failed: 0 }] });
		const json = fetch.mock.calls.find(([url]) => String(url).endsWith('/_json'))!;
		expect(JSON.parse(String(json[1]?.body))).toEqual([{ message: 'fixture' }]);
		await cli.executeLine('oo ingest multi @events.ndjson --stream app --yes --json', io);
		expect(readText).toHaveBeenCalledOnce();
		const ndjson = fetch.mock.calls.find(([url]) => String(url).endsWith('/_multi'))!;
		expect(String(ndjson[1]?.body)).toBe('{"message":"fixture"}\n');
		expect(new Headers(ndjson[1]?.headers).get('content-type')).toBe('application/x-ndjson');
		await cli.execute(['oo', 'stream', 'update', 'app', '--input', '{"data_retention":7}', '--yes', '--json'], io);
		expect(fetch.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true);
		await cli.executeLine('oo stream delete app --yes --json', io);
		expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
	});
	it('checks writable policy and confirmation before files, credentials and HTTP', async () => {
		const readonly = fixture(true);
		await expect(readonly.cli.executeLine('oo ingest multi @events.ndjson --stream app --yes', readonly.io)).rejects.toThrow('read-only');
		expect(readonly.readText).not.toHaveBeenCalled();
		expect(readonly.getEnv).not.toHaveBeenCalled();
		expect(readonly.fetch).not.toHaveBeenCalled();
		const writable = fixture();
		await expect(writable.cli.executeLine('oo stream update app --input @settings.json', writable.io)).rejects.toThrow('--yes');
		expect(writable.readText).not.toHaveBeenCalled();
		expect(writable.getEnv).not.toHaveBeenCalled();
		expect(writable.fetch).not.toHaveBeenCalled();
	});
});
