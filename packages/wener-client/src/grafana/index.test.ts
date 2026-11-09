import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { GrafanaClient } from './index';

function response(value: unknown, init?: ResponseInit): Response {
	return Response.json(value, init);
}
function client(fetch: FetchLike, options: Partial<ConstructorParameters<typeof GrafanaClient>[0]> = {}) {
	return new GrafanaClient({ baseUrl: 'https://grafana.example.test/', fetch, ...options });
}

describe('GrafanaClient', () => {
	it('checks health via GET /api/health', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ database: 'ok', version: '11.0.0' }));
		const test = client(fetch);
		const result = await test.health();
		expect(result).toEqual({ database: 'ok', version: '11.0.0' });
		const [url, init] = fetch.mock.calls[0]!;
		expect(new URL(url.toString()).pathname).toBe('/api/health');
		expect(init?.method).toBe('GET');
		await test.close();
	});

	it('reads the current user via GET /api/user', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ login: 'admin', email: 'admin@example.test' }));
		const test = client(fetch, { accessToken: 'fixture-token' });
		const result = await test.whoAmI();
		expect(result).toEqual({ login: 'admin', email: 'admin@example.test' });
		const [url, init] = fetch.mock.calls[0]!;
		expect(new URL(url.toString()).pathname).toBe('/api/user');
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer fixture-token');
		await test.close();
	});

	it('passes through a generic GET request with query parameters', async () => {
		const fetch = vi.fn<FetchLike>(async () => response([{ id: 1, title: 'Dashboard' }]));
		const test = client(fetch);
		const result = await test.request({ path: '/api/search', params: { type: 'dash-db', tag: ['a', 'b'] } });
		expect(result).toEqual([{ id: 1, title: 'Dashboard' }]);
		const url = new URL(fetch.mock.calls[0]![0].toString());
		expect(url.pathname).toBe('/api/search');
		expect(url.searchParams.get('type')).toBe('dash-db');
		expect(url.searchParams.getAll('tag')).toEqual(['a', 'b']);
		await test.close();
	});

	it('passes through a write request with a JSON body', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ id: 1, status: 'success' }));
		const test = client(fetch);
		const result = await test.request({ path: '/api/dashboards/db', method: 'POST', body: { dashboard: { title: 'New' } } });
		expect(result).toEqual({ id: 1, status: 'success' });
		const [, init] = fetch.mock.calls[0]!;
		expect(init?.method).toBe('POST');
		expect(JSON.parse(init?.body as string)).toEqual({ dashboard: { title: 'New' } });
		expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
		await test.close();
	});

	it('rejects unsafe paths and GET requests with a body', async () => {
		const test = client(vi.fn<FetchLike>());
		await expect(test.request({ path: '/api/../secrets' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(test.request({ path: '/api/health', method: 'GET', body: { a: 1 } })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});

	it('supports bearer, basic and custom header authentication', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ ok: true }));
		await client(fetch, { accessToken: 'fixture-token' }).health();
		expect(new Headers(fetch.mock.calls[0]![1]?.headers).get('authorization')).toBe('Bearer fixture-token');
		await client(fetch, { username: 'fixture-user', password: 'fixture-password' }).health();
		expect(new Headers(fetch.mock.calls[1]![1]?.headers).get('authorization')).toMatch(/^Basic /u);
		await client(fetch, { headers: { 'x-api-key': 'fixture-header' } }).health();
		expect(new Headers(fetch.mock.calls[2]![1]?.headers).get('x-api-key')).toBe('fixture-header');
	});

	it('uses fixed summaries for HTTP errors', async () => {
		const http = client(vi.fn<FetchLike>(async () => response({ message: 'PRIVATE_SERVER_ERROR' }, { status: 500 })));
		await expect(http.health()).rejects.toMatchObject({ code: 'REQUEST_FAILED', message: 'Grafana health request failed' });
		const auth = client(vi.fn<FetchLike>(async () => response({ message: 'unauthorized' }, { status: 401 })));
		await expect(auth.whoAmI()).rejects.toMatchObject({ code: 'AUTH_FAILED' });
	});

	it.each([409, 412])('maps HTTP %i to a CONFLICT error without leaking the response body', async (status) => {
		const secret = 'fixture-secret-version-token';
		const test = client(vi.fn<FetchLike>(async () => response({ message: 'version mismatch', token: secret }, { status })));
		const error = await test.health().catch((value: unknown) => value);
		expect(error).toMatchObject({ code: 'CONFLICT', status });
		expect((error as Error).message).not.toContain(secret);
		expect((error as Error).message).not.toContain('version mismatch');
	});

	it('handles timeout, cancellation and close', async () => {
		let resolve!: (value: Response) => void;
		const pending = vi.fn<FetchLike>((_url, init) => new Promise<Response>((res) => {
			resolve = res;
			init?.signal?.addEventListener('abort', () => undefined);
		}));
		const test = client(pending, { timeoutMs: 10 });
		await expect(test.health()).rejects.toMatchObject({ code: 'TIMEOUT' });
		const controller = new AbortController();
		const aborted = test.health({ signal: controller.signal });
		controller.abort();
		await expect(aborted).rejects.toMatchObject({ code: 'ABORTED' });
		const closing = test.health();
		await test.close();
		await expect(closing).rejects.toMatchObject({ code: 'CLOSED' });
		await expect(test.health()).rejects.toMatchObject({ code: 'CLOSED' });
		resolve(response({ ok: true }));
	});

	it('lists dashboards via GET /api/search with query/tag/folderUIDs/limit params', async () => {
		const fetch = vi.fn<FetchLike>(async () => response([{ uid: 'dash-1', title: 'Dashboard' }]));
		const test = client(fetch);
		const result = await test.listDashboard({ query: 'cpu', tag: ['a', 'b'], folderUid: 'folder-1', limit: 20 });
		expect(result).toEqual([{ uid: 'dash-1', title: 'Dashboard' }]);
		const url = new URL(fetch.mock.calls[0]![0].toString());
		expect(url.pathname).toBe('/api/search');
		expect(url.searchParams.get('type')).toBe('dash-db');
		expect(url.searchParams.get('query')).toBe('cpu');
		expect(url.searchParams.getAll('tag')).toEqual(['a', 'b']);
		expect(url.searchParams.get('folderUIDs')).toBe('folder-1');
		expect(url.searchParams.get('limit')).toBe('20');
		await test.close();
	});

	it('gets a dashboard via GET /api/dashboards/uid/:uid with uid encoding', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ dashboard: { uid: 'dash/1' }, meta: {} }));
		const test = client(fetch);
		const result = await test.getDashboard({ uid: 'dash/1' });
		expect(result).toEqual({ dashboard: { uid: 'dash/1' }, meta: {} });
		const url = new URL(fetch.mock.calls[0]![0].toString());
		expect(url.pathname).toBe('/api/dashboards/uid/dash%2F1');
		await test.close();
	});

	it('updates a dashboard via POST /api/dashboards/db', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ uid: 'dash-1', status: 'success' }));
		const test = client(fetch);
		const result = await test.updateDashboard({ dashboard: { uid: 'dash-1', title: 'New' }, folderUid: 'folder-1', message: 'update', overwrite: true });
		expect(result).toEqual({ uid: 'dash-1', status: 'success' });
		const [url, init] = fetch.mock.calls[0]!;
		expect(new URL(url.toString()).pathname).toBe('/api/dashboards/db');
		expect(init?.method).toBe('POST');
		expect(JSON.parse(init?.body as string)).toEqual({ dashboard: { uid: 'dash-1', title: 'New' }, folderUid: 'folder-1', message: 'update', overwrite: true });
		await test.close();
	});

	it('previews updateDashboard with dryRun:true without issuing any fetch', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ uid: 'dash-1', status: 'success' }));
		const test = client(fetch);
		const result = await test.updateDashboard({ dashboard: { uid: 'dash-1', title: 'New' }, folderUid: 'folder-1', message: 'update', overwrite: true, dryRun: true });
		expect(result).toEqual({
			dryRun: true,
			changed: true,
			dashboard: { uid: 'dash-1', title: 'New' },
			folderUid: 'folder-1',
			message: 'update',
			overwrite: true,
		});
		expect(fetch).not.toHaveBeenCalled();
		await test.close();
	});

	it('finds a panel by id within a dashboard', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }] } }));
		const test = client(fetch);
		const panel = await test.getPanel({ dashboardUid: 'dash-1', panelId: 2 });
		expect(panel).toEqual({ id: 2, title: 'B' });
		await test.close();
	});

	it('rejects getPanel with NOT_FOUND when the panel id is missing', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }] } }));
		const test = client(fetch);
		await expect(test.getPanel({ dashboardUid: 'dash-1', panelId: 99 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
		await test.close();
	});

	it('patches a panel with --set by writing a nested path and pushing the whole dashboard back', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success', version: 2 });
			return response({ dashboard: { uid: 'dash-1', version: 1, panels: [{ id: 1, title: 'A', fieldConfig: { defaults: {} } }, { id: 2, title: 'B' }] } });
		});
		const test = client(fetch);
		const result = await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { 'fieldConfig.defaults.unit': 'bytes', title: 'CPU' } });
		expect(result).toMatchObject({
			changed: true,
			uid: 'dash-1', status: 'success', // raw save response fields are preserved
			panel: { id: 1, title: 'CPU', fieldConfig: { defaults: { unit: 'bytes' } } },
			dashboard: { uid: 'dash-1', version: 2 }, // save response's version wins over the pre-save dashboard
		});
		const putCall = fetch.mock.calls.find((call) => new URL(call[0].toString()).pathname.endsWith('/db'))!;
		const body = JSON.parse(putCall[1]?.body as string);
		expect(body.dashboard.panels[0]).toEqual({ id: 1, title: 'CPU', fieldConfig: { defaults: { unit: 'bytes' } } });
		expect(body.dashboard.panels[1]).toEqual({ id: 2, title: 'B' });
		await test.close();
	});

	it('returns changed:false and skips the save when the patch is a no-op', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({ dashboard: { uid: 'dash-1', version: 1, panels: [{ id: 1, title: 'A', fieldConfig: { defaults: { unit: 'bytes' } } }] } });
		});
		const test = client(fetch);
		const result = await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'A', 'fieldConfig.defaults.unit': 'bytes' } });
		expect(result).toEqual({ changed: false, panel: { id: 1, title: 'A', fieldConfig: { defaults: { unit: 'bytes' } } }, dashboard: { uid: 'dash-1', version: 1 } });
		expect(fetch).toHaveBeenCalledTimes(1); // only the GET; no POST /api/dashboards/db
		expect(fetch.mock.calls.some((call) => new URL(call[0].toString()).pathname.endsWith('/db'))).toBe(false);
		await test.close();
	});

	it('patches a panel with dryRun:true: still GETs and computes the change, but never POSTs', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success', version: 2 });
			return response({ dashboard: { uid: 'dash-1', version: 1, panels: [{ id: 1, title: 'A', fieldConfig: { defaults: {} } }] } });
		});
		const test = client(fetch);
		const result = await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'CPU' }, dryRun: true });
		expect(result).toEqual({
			changed: true,
			panel: { id: 1, title: 'CPU', fieldConfig: { defaults: {} } },
			dashboard: { uid: 'dash-1', version: 1 },
			dryRun: true,
		});
		expect(fetch).toHaveBeenCalledTimes(1); // only the GET; no POST /api/dashboards/db
		expect(fetch.mock.calls.some((call) => new URL(call[0].toString()).pathname.endsWith('/db'))).toBe(false);
		await test.close();
	});

	it('patches a panel with dryRun:true as a no-op: GETs, reports no change, and never POSTs', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({ dashboard: { uid: 'dash-1', version: 1, panels: [{ id: 1, title: 'A' }] } });
		});
		const test = client(fetch);
		const result = await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'A' }, dryRun: true });
		expect(result).toEqual({ changed: false, panel: { id: 1, title: 'A' }, dashboard: { uid: 'dash-1', version: 1 }, dryRun: true });
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch.mock.calls.some((call) => new URL(call[0].toString()).pathname.endsWith('/db'))).toBe(false);
		await test.close();
	});

	it('sets a single deep path without mutating the original panel shared with the dashboard tree', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({ dashboard: { uid: 'dash-1', version: 1, panels: [{ id: 1, title: 'A', fieldConfig: { defaults: { unit: 'short' } } }] } });
		});
		const test = client(fetch);
		const result = await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { 'fieldConfig.defaults.unit': 'bytes' } });
		expect(result).toMatchObject({ changed: true, panel: { id: 1, title: 'A', fieldConfig: { defaults: { unit: 'bytes' } } } });
		expect(fetch.mock.calls.some((call) => new URL(call[0].toString()).pathname.endsWith('/db'))).toBe(true);
		const putCall = fetch.mock.calls.find((call) => new URL(call[0].toString()).pathname.endsWith('/db'))!;
		const body = JSON.parse(putCall[1]?.body as string);
		expect(body.dashboard.panels[0]).toEqual({ id: 1, title: 'A', fieldConfig: { defaults: { unit: 'bytes' } } });
		await test.close();
	});

	it('does not corrupt the no-op check when set only touches an existing deep path shared by reference', async () => {
		// Regression: before the deep clone fix, `updated = { ...panel }` kept sharing the nested
		// `fieldConfig` object with the original panel, so `setPathValue` mutated it in place and
		// `deepEqualJson(updated, panel)` compared the panel against itself, always reporting no-op.
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({ dashboard: { uid: 'dash-1', version: 1, panels: [{ id: 1, title: 'A', fieldConfig: { defaults: { unit: 'short' } } }] } });
		});
		const test = client(fetch);
		const result = await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { 'fieldConfig.defaults.unit': 'different' } });
		expect(result).toMatchObject({ changed: true });
		expect(fetch.mock.calls.some((call) => new URL(call[0].toString()).pathname.endsWith('/db'))).toBe(true);
		await test.close();
	});

	it('returns changed:true with a merged result for --merge, deep-merging objects and replacing arrays wholesale', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A', fieldConfig: { defaults: { unit: 'short' } }, targets: ['x'] }] } });
		});
		const test = client(fetch);
		const result = await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, merge: { fieldConfig: { defaults: { min: 0 } }, targets: ['y', 'z'] } });
		expect(result).toMatchObject({
			changed: true,
			panel: { id: 1, title: 'A', fieldConfig: { defaults: { unit: 'short', min: 0 } }, targets: ['y', 'z'] },
		});
		const putCall = fetch.mock.calls.find((call) => new URL(call[0].toString()).pathname.endsWith('/db'))!;
		const body = JSON.parse(putCall[1]?.body as string);
		expect(body.dashboard.panels[0]).toEqual({ id: 1, title: 'A', fieldConfig: { defaults: { unit: 'short', min: 0 } }, targets: ['y', 'z'] });
		await test.close();
	});

	it('returns changed:true with the replacement panel for --from, replacing it wholesale', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }] } });
		});
		const test = client(fetch);
		const result = await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, replace: { id: 1, title: 'Replaced', type: 'timeseries' } });
		expect(result).toMatchObject({ changed: true, panel: { id: 1, title: 'Replaced', type: 'timeseries' } });
		const putCall = fetch.mock.calls.find((call) => new URL(call[0].toString()).pathname.endsWith('/db'))!;
		const body = JSON.parse(putCall[1]?.body as string);
		expect(body.dashboard.panels[0]).toEqual({ id: 1, title: 'Replaced', type: 'timeseries' });
		await test.close();
	});

	it('rejects patchPanel when the replacement id does not match the panel id', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }] } }));
		const test = client(fetch);
		await expect(test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, replace: { id: 2, title: 'Wrong' } })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});

	it('rejects patchPanel when zero or more than one edit mode is provided', async () => {
		const test = client(vi.fn<FetchLike>());
		await expect(test.patchPanel({ dashboardUid: 'dash-1', panelId: 1 })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'x' }, merge: { title: 'y' } })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});

	it('finds and patches a panel nested inside a collapsed row, leaving sibling rows untouched', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({
				dashboard: {
					uid: 'dash-1',
					panels: [
						{ id: 100, type: 'row', title: 'Row A', panels: [{ id: 1, title: 'Nested' }] },
						{ id: 101, type: 'row', title: 'Row B', panels: [{ id: 2, title: 'Other' }] },
					],
				},
			});
		});
		const test = client(fetch);
		const panel = await test.getPanel({ dashboardUid: 'dash-1', panelId: 1 });
		expect(panel).toEqual({ id: 1, title: 'Nested' });
		await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'Patched' } });
		const putCall = fetch.mock.calls.find((call) => new URL(call[0].toString()).pathname.endsWith('/db'))!;
		const body = JSON.parse(putCall[1]?.body as string);
		expect(body.dashboard.panels[0]).toEqual({ id: 100, type: 'row', title: 'Row A', panels: [{ id: 1, title: 'Patched' }] });
		expect(body.dashboard.panels[1]).toEqual({ id: 101, type: 'row', title: 'Row B', panels: [{ id: 2, title: 'Other' }] });
		await test.close();
	});

	it('rejects getPanel/patchPanel with AMBIGUOUS when a panel id is duplicated', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({
			dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }, { id: 100, type: 'row', panels: [{ id: 1, title: 'Dup' }] }] },
		}));
		const test = client(fetch);
		await expect(test.getPanel({ dashboardUid: 'dash-1', panelId: 1 })).rejects.toMatchObject({ code: 'AMBIGUOUS' });
		await expect(test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'x' } })).rejects.toMatchObject({ code: 'AMBIGUOUS' });
	});

	it('preserves the dashboard meta.folderUid on patchPanel writes', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }] }, meta: { folderUid: 'folder-7' } });
		});
		const test = client(fetch);
		await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'B' } });
		const putCall = fetch.mock.calls.find((call) => new URL(call[0].toString()).pathname.endsWith('/db'))!;
		const body = JSON.parse(putCall[1]?.body as string);
		expect(body.folderUid).toBe('folder-7');
		await test.close();
	});

	it('omits folderUid on patchPanel writes when the dashboard has no meta.folderUid', async () => {
		const fetch = vi.fn<FetchLike>(async (url) => {
			if (new URL(url.toString()).pathname.endsWith('/db')) return response({ uid: 'dash-1', status: 'success' });
			return response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }] } });
		});
		const test = client(fetch);
		await test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { title: 'B' } });
		const putCall = fetch.mock.calls.find((call) => new URL(call[0].toString()).pathname.endsWith('/db'))!;
		const body = JSON.parse(putCall[1]?.body as string);
		expect(body.folderUid).toBeUndefined();
		await test.close();
	});

	it('rejects __proto__/constructor/prototype segments in --set and leaves Object.prototype clean', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }] } }));
		const test = client(fetch);
		await expect(test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { '__proto__.polluted': 'yes' } })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, set: { 'constructor.prototype.polluted': 'yes' } })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	it('rejects __proto__/constructor/prototype keys in --merge and leaves Object.prototype clean', async () => {
		const fetch = vi.fn<FetchLike>(async () => response({ dashboard: { uid: 'dash-1', panels: [{ id: 1, title: 'A' }] } }));
		const test = client(fetch);
		// JSON.parse makes __proto__ an own enumerable key (unlike an object literal, which would set the prototype instead).
		const protoMerge = JSON.parse('{"__proto__":{"polluted":"yes"}}');
		const ctorMerge = JSON.parse('{"constructor":{"prototype":{"polluted":"yes"}}}');
		await expect(test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, merge: protoMerge })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(test.patchPanel({ dashboardUid: 'dash-1', panelId: 1, merge: ctorMerge })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});
});
