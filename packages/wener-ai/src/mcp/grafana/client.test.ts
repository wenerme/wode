import { afterEach, describe, expect, it, vi } from 'vitest';
import { GrafanaApiClient } from './client';

describe('GrafanaApiClient', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('adds auth, org, and extra headers to requests', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const client = new GrafanaApiClient({
			url: 'http://grafana.local',
			serviceAccountToken: 'token',
			orgId: 12,
			extraHeaders: { 'X-Test': '1' },
			timeoutMs: 1_000,
			debug: false,
		});

		await client.request({ path: '/api/health' });

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [, init] = fetchMock.mock.calls[0]!;
		const headers = new Headers(init?.headers as HeadersInit);
		expect(headers.get('authorization')).toBe('Bearer token');
		expect(headers.get('x-grafana-org-id')).toBe('12');
		expect(headers.get('x-test')).toBe('1');
		expect(headers.get('accept')).toBe('application/json');
	});
});
