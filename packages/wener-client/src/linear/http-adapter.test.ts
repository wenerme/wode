import { describe, expect, test, vi } from 'vitest';
import { LinearConnectionConfigSchema } from './config';
import { LinearServiceErrorCodes } from './errors';
import { createLinearHttpAdapter } from './http-adapter';
import { comment, connection, issue, json, pageInfo, viewer } from './linear.fixture';

describe('Linear HTTP adapter: migrated source regressions', () => {
	test('personal API key and Relay issue connection', async () => {
		const fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
			expect(url).toBe('https://example.test/graphql');
			expect(new Headers(init?.headers).get('authorization')).toBe('example-secret');
			expect(init?.redirect).toBe('manual');
			const body = JSON.parse(String(init?.body));
			expect(body.variables).toMatchObject({ first: 20, includeArchived: false, filter: { team: { id: { eq: 'team-id' } } } });
			return json({ data: { issues: { nodes: [issue()], pageInfo } } });
		});
		const adapter = createLinearHttpAdapter(connection({ apiKey: 'example-secret' }), { fetch });
		await expect(adapter.listIssue({ first: 20, teamId: 'team-id' })).resolves.toMatchObject({ nodes: [{ identifier: 'DEMO-1' }] });
		await adapter.close();
	});
	test('nested filters combine team/query conditions with AND', async () => {
		const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
			expect(JSON.parse(String(init?.body)).variables.filter).toEqual({ and: [
				{ team: { id: { eq: 'team-id' } }, or: [{ title: { containsIgnoreCase: 'Issue' } }, { description: { containsIgnoreCase: 'Issue' } }] },
				{ or: [{ state: { type: { eq: 'started' } } }, { priority: { gt: 0 } }] },
			] });
			return json({ data: { issues: { nodes: [issue()], pageInfo } } });
		});
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		await adapter.listIssue({ teamId: 'team-id', query: 'Issue', filter: { or: [{ state: { type: { eq: 'started' } } }, { priority: { gt: 0 } }] } });
		await adapter.close();
	});
	test('custom-only filter and original simple-filter shape', async () => {
		const filters: unknown[] = [];
		const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
			filters.push(JSON.parse(String(init?.body)).variables.filter);
			return json({ data: { issues: { nodes: [issue()], pageInfo } } });
		});
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		const custom = { project: { status: { type: { eq: 'completed' } } } };
		await adapter.listIssue({ filter: custom });
		await adapter.listIssue({ teamId: 'team-id' });
		expect(filters).toEqual([custom, { team: { id: { eq: 'team-id' } } }]);
		await adapter.close();
	});
	test('OAuth Bearer authentication and typed mutation DTO', async () => {
		const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer example-oauth');
			return json({ data: { issueCreate: { success: true, issue: { ...issue(), privateExtra: true } } } });
		});
		const adapter = createLinearHttpAdapter(connection({ accessToken: 'example-oauth', readOnly: false }), { fetch });
		expect(await adapter.createIssue({ teamId: 'team-id', title: 'Created' })).toEqual(issue());
		await adapter.close();
	});
	test('explicit empty GraphQL errors array is accepted', async () => {
		const adapter = createLinearHttpAdapter(connection(), { fetch: vi.fn(async () => json({ errors: [], data: { viewer } })) });
		await expect(adapter.getViewer()).resolves.toEqual(viewer);
		await adapter.close();
	});
	test('429 retries and fixed redacted GraphQL errors', async () => {
		const sleep = vi.fn(async () => undefined);
		const fetch = vi.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(json({ error: 'example-secret' }, 429, { 'retry-after': '0' }))
			.mockResolvedValueOnce(json({ errors: [{ message: 'token example-secret is invalid' }], data: { viewer: null } }));
		const adapter = createLinearHttpAdapter(connection({ apiKey: 'example-secret', maxRetries: 1 }), { fetch, sleep });
		const error = await adapter.getViewer().catch((error: unknown) => error);
		expect(error).toMatchObject({ code: LinearServiceErrorCodes.OperationFailed, message: 'Linear service operation failed' });
		expect(String(error)).not.toContain('example-secret');
		expect(sleep).toHaveBeenCalledOnce();
		await adapter.close();
	});
	test('streamed response-size bound hides body content', async () => {
		const token = 'example-bounded-secret';
		const adapter = createLinearHttpAdapter(connection({ apiKey: token, maxResponseBytes: 1_024 }), {
			fetch: vi.fn(async () => json({ data: { viewer: { name: token.repeat(100) } } })),
		});
		const error = await adapter.getViewer().catch((error: unknown) => error);
		expect(error).toMatchObject({ code: LinearServiceErrorCodes.OperationFailed });
		expect(String(error)).not.toContain(token);
		await adapter.close();
	});
	test('HTTP 400 RATELIMITED retries reads with bounded reset delay', async () => {
		const sleep = vi.fn(async () => undefined);
		const fetch = vi.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(json({ errors: [{ message: 'limited', extensions: { code: 'RATELIMITED' } }] }, 400, { 'x-ratelimit-requests-reset': String(Date.now() + 60_000) }))
			.mockResolvedValueOnce(json({ data: { viewer } }));
		const adapter = createLinearHttpAdapter(connection({ apiKey: 'example-key', maxRetries: 1, maxRetryDelayMs: 250 }), { fetch, sleep });
		await expect(adapter.getViewer()).resolves.toEqual(viewer);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(sleep).toHaveBeenCalledWith(250, expect.any(AbortSignal));
		await adapter.close();
	});
	test('5xx never replays mutations', async () => {
		const fetch = vi.fn(async () => json({ error: 'uncertain mutation' }, 503));
		const adapter = createLinearHttpAdapter(connection({ apiKey: 'example-key', readOnly: false, maxRetries: 5 }), { fetch });
		await expect(adapter.createIssue({ teamId: 'team-id', title: 'No replay' })).rejects.toMatchObject({ code: LinearServiceErrorCodes.OperationFailed });
		expect(fetch).toHaveBeenCalledOnce();
		await adapter.close();
	});
	test('close aborts in-flight fetch and waits for physical completion', async () => {
		let started!: () => void;
		const start = new Promise<void>((resolve) => { started = resolve; });
		let signal: AbortSignal | undefined;
		const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit): Promise<Response> => new Promise((_resolve, reject) => {
			signal = init?.signal ?? undefined;
			started();
			signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
		}));
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		const request = adapter.getViewer().catch((error: unknown) => error);
		await start;
		const close = adapter.close();
		expect(adapter.close()).toBe(close);
		await close;
		expect(await request).toMatchObject({ code: LinearServiceErrorCodes.Closed });
		expect(signal?.aborted).toBe(true);
		expect(fetch).toHaveBeenCalledOnce();
		await expect(adapter.getViewer()).rejects.toMatchObject({ code: LinearServiceErrorCodes.Closed });
	});
	test('close cancels retry wait without issuing another request', async () => {
		let markSleeping!: () => void;
		const sleeping = new Promise<void>((resolve) => { markSleeping = resolve; });
		const sleep = vi.fn(async (_ms: number, signal: AbortSignal) => {
			markSleeping();
			return new Promise<void>((_resolve, reject) => { signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }); });
		});
		const fetch = vi.fn(async () => json({ error: 'retry' }, 503));
		const adapter = createLinearHttpAdapter(connection(), { fetch, sleep });
		const request = adapter.getViewer().catch((error: unknown) => error);
		await sleeping;
		await adapter.close();
		expect(await request).toMatchObject({ code: LinearServiceErrorCodes.Closed });
		expect(fetch).toHaveBeenCalledOnce();
	});
	test('close waits for delayed reader cancellation and Closed takes precedence', async () => {
		let markReading!: () => void;
		const reading = new Promise<void>((resolve) => { markReading = resolve; });
		let releaseCancel!: () => void;
		const cancelGate = new Promise<void>((resolve) => { releaseCancel = resolve; });
		const stream = new ReadableStream<Uint8Array>({
			pull() { markReading(); return new Promise<void>(() => undefined); }, cancel: () => cancelGate,
		});
		const adapter = createLinearHttpAdapter(connection(), { fetch: vi.fn(async () => new Response(stream)) });
		const request = adapter.getViewer().catch((error: unknown) => error);
		await reading;
		let settled = false;
		const close = adapter.close().finally(() => { settled = true; });
		for (let index = 0; index < 5; index++) await Promise.resolve();
		expect(settled).toBe(false);
		releaseCancel();
		await close;
		expect(await request).toMatchObject({ code: LinearServiceErrorCodes.Closed });
	});
	test('default retry wait clears timers on close', async () => {
		vi.useFakeTimers();
		try {
			const fetch = vi.fn(async () => json({ error: 'retry' }, 503));
			const adapter = createLinearHttpAdapter(connection({ apiKey: 'example-key', maxRetryDelayMs: 30_000 }), { fetch });
			const request = adapter.getViewer().catch((error: unknown) => error);
			for (let index = 0; index < 10 && vi.getTimerCount() < 2; index++) await Promise.resolve();
			expect(vi.getTimerCount()).toBeGreaterThanOrEqual(2);
			await adapter.close();
			expect(await request).toMatchObject({ code: LinearServiceErrorCodes.Closed });
			expect(vi.getTimerCount()).toBe(0);
			expect(fetch).toHaveBeenCalledOnce();
		} finally { vi.useRealTimers(); }
	});
});

describe('Linear migrated client seams', () => {
	test('connection requires exactly one auth method and rejects credential-bearing URLs', () => {
		for (const invalid of [{}, { apiKey: 'key', accessToken: 'token' }, { apiKey: 'key', baseUrl: 'https://user:pass@example.test/graphql' }, { apiKey: 'key', baseUrl: 'https://example.test/graphql?token=secret' }]) {
			expect(LinearConnectionConfigSchema.safeParse(invalid).success).toBe(false);
		}
		expect(connection({ apiKey: ' raw-key ' }).apiKey).toBe(' raw-key ');
		expect(() => createLinearHttpAdapter({ ...connection(), accessToken: 'other' })).toThrow('configuration is invalid');
	});
	test('all 11 operations preserve GraphQL variables, filters, DTOs and pagination', async () => {
		const seen: { query: string; variables: Record<string, unknown> }[] = [];
		const page = { nodes: [], pageInfo: { hasNextPage: true, endCursor: 'next-cursor' } };
		const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
			seen.push(JSON.parse(String(init?.body)));
			return json({ data: {
				viewer, teams: { ...page, nodes: [issue().team] }, team: { states: page }, users: { ...page, nodes: [viewer] },
				projects: page, issues: { ...page, nodes: [issue()] }, issue: { ...issue(), comments: { ...page, nodes: [comment] } },
				issueCreate: { success: true, issue: issue() }, issueUpdate: { success: true, issue: issue() },
				commentCreate: { success: true, comment },
			} });
		});
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		await expect(adapter.getViewer()).resolves.toEqual(viewer);
		await expect(adapter.listTeam({ after: 'cursor', includeArchived: true })).resolves.toMatchObject({ pageInfo: page.pageInfo });
		await expect(adapter.listIssueState({ teamId: 'team-id' })).resolves.toEqual(page);
		await expect(adapter.listUser({ query: 'Example' })).resolves.toMatchObject({ nodes: [viewer] });
		await expect(adapter.listProject({ teamId: 'team-id', query: 'Project' })).resolves.toEqual(page);
		await expect(adapter.listIssue({ assigneeId: 'user-id', projectId: 'project-id', stateId: 'state-id', updatedAfter: '2026-01-01T00:00:00.000Z' })).resolves.toMatchObject({ nodes: [issue()] });
		await expect(adapter.getIssue({ id: 'DEMO-1' })).resolves.toEqual(issue());
		await expect(adapter.createIssue({ teamId: 'team-id', title: 'Title', labelIds: ['label-id'], priority: 3 })).resolves.toEqual(issue());
		await expect(adapter.updateIssue({ id: 'DEMO-1', assigneeId: null, projectId: null, dueDate: null })).resolves.toEqual(issue());
		await expect(adapter.listComment({ issueId: 'DEMO-1', first: 10 })).resolves.toMatchObject({ nodes: [comment] });
		await expect(adapter.createComment({ issueId: 'DEMO-1', body: 'Body' })).resolves.toEqual(comment);
		expect(seen).toHaveLength(11);
		expect(seen[1].variables).toMatchObject({ after: 'cursor', includeArchived: true, first: 50 });
		expect(seen[3].variables.filter).toEqual({ or: [{ name: { containsIgnoreCase: 'Example' } }, { email: { containsIgnoreCase: 'Example' } }] });
		expect(seen[4].variables.filter).toEqual({ accessibleTeams: { some: { id: { eq: 'team-id' } } }, name: { containsIgnoreCase: 'Project' } });
		expect(seen[5].variables.filter).toEqual({ assignee: { id: { eq: 'user-id' } }, project: { id: { eq: 'project-id' } }, state: { id: { eq: 'state-id' } }, updatedAt: { gte: '2026-01-01T00:00:00.000Z' } });
		expect(seen[8].variables).toEqual({ id: 'DEMO-1', input: { assigneeId: null, projectId: null, dueDate: null } });
		await adapter.close();
	});
	test('per-call abort cancels fetch, preserves reason, and leaves other calls usable', async () => {
		const controller = new AbortController();
		let markStarted!: () => void;
		const started = new Promise<void>((resolve) => { markStarted = resolve; });
		const fetch = vi.fn<typeof globalThis.fetch>().mockImplementationOnce(async (_url, init) => new Promise((_resolve, reject) => {
			init?.signal?.addEventListener('abort', () => reject(new Error('transport secret')), { once: true });
			markStarted();
		})).mockResolvedValueOnce(json({ data: { viewer } }));
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		const request = adapter.getViewer({ signal: controller.signal });
		await started;
		const reason = new Error('caller cancelled');
		controller.abort(reason);
		await expect(request).rejects.toBe(reason);
		await expect(adapter.getViewer()).resolves.toEqual(viewer);
		await adapter.close();
	});
	test('pre-aborted call never reaches fetch', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		const signal = AbortSignal.abort(new Error('cancelled'));
		await expect(adapter.listIssue({}, { signal })).rejects.toBe(signal.reason);
		expect(fetch).not.toHaveBeenCalled();
		await adapter.close();
	});
	test('every operation forwards a pre-aborted signal to HTTP', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		const signal = AbortSignal.abort(new Error('cancelled'));
		const options = { signal };
		for (const call of [
			() => adapter.getViewer(options), () => adapter.listTeam(undefined, options),
			() => adapter.listIssueState({ teamId: 'team-id' }, options), () => adapter.listUser(undefined, options),
			() => adapter.listProject(undefined, options), () => adapter.listIssue(undefined, options),
			() => adapter.getIssue({ id: 'DEMO-1' }, options),
			() => adapter.createIssue({ teamId: 'team-id', title: 'Title' }, options),
			() => adapter.updateIssue({ id: 'DEMO-1', title: 'Title' }, options),
			() => adapter.listComment({ issueId: 'DEMO-1' }, options),
			() => adapter.createComment({ issueId: 'DEMO-1', body: 'Body' }, options),
		]) await expect(call()).rejects.toBe(signal.reason);
		expect(fetch).not.toHaveBeenCalled();
		await adapter.close();
	});
	test('per-call body cancellation waits for reader cleanup and keeps the adapter usable', async () => {
		let markReading!: () => void;
		const reading = new Promise<void>((resolve) => { markReading = resolve; });
		let releaseCancel!: () => void;
		const cancellation = new Promise<void>((resolve) => { releaseCancel = resolve; });
		const cancel = vi.fn(() => cancellation);
		const stream = new ReadableStream<Uint8Array>({
			pull() { markReading(); return new Promise<void>(() => undefined); }, cancel,
		});
		const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(new Response(stream)).mockResolvedValueOnce(json({ data: { viewer } }));
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		const controller = new AbortController();
		let settled = false;
		const request = adapter.getViewer({ signal: controller.signal }).catch((error: unknown) => error).finally(() => { settled = true; });
		await reading;
		controller.abort();
		for (let index = 0; index < 5; index++) await Promise.resolve();
		expect(cancel).toHaveBeenCalledOnce();
		expect(settled).toBe(false);
		releaseCancel();
		expect(await request).toBe(controller.signal.reason);
		await expect(adapter.getViewer()).resolves.toEqual(viewer);
		await adapter.close();
	});
	test('per-call abort cancels retry wait without replay', async () => {
		const controller = new AbortController();
		let markSleeping!: () => void;
		const sleeping = new Promise<void>((resolve) => { markSleeping = resolve; });
		const fetch = vi.fn(async () => json({}, 503));
		const adapter = createLinearHttpAdapter(connection(), { fetch, sleep: async (_ms, signal) => {
			markSleeping();
			return new Promise<void>((_resolve, reject) => { signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }); });
		} });
		const request = adapter.getViewer({ signal: controller.signal }).catch((error: unknown) => error);
		await sleeping;
		controller.abort();
		expect(await request).toBe(controller.signal.reason);
		expect(fetch).toHaveBeenCalledOnce();
		await adapter.close();
	});
	test('timeout aborts fetch and produces a fixed error without retries', async () => {
		vi.useFakeTimers();
		try {
			const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit): Promise<Response> => new Promise((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(new Error('transport secret')), { once: true });
			}));
			const adapter = createLinearHttpAdapter(connection({ apiKey: 'example-key', requestTimeoutMs: 1_000 }), { fetch });
			const request = adapter.getViewer().catch((error: unknown) => error);
			await vi.advanceTimersByTimeAsync(1_000);
			expect(await request).toMatchObject({ code: LinearServiceErrorCodes.OperationFailed, message: 'Linear service operation failed' });
			expect(fetch).toHaveBeenCalledOnce();
			await adapter.close();
			expect(vi.getTimerCount()).toBe(0);
		} finally { vi.useRealTimers(); }
	});
	test.each([429, 503, 400, 200])('all mutations are never replayed for HTTP %s rate limits/errors', async (status) => {
		const fetch = vi.fn(async () => json({ errors: [{ extensions: { code: 'RATELIMITED' }, message: 'private upstream detail' }] }, status));
		const sleep = vi.fn(async () => undefined);
		const adapter = createLinearHttpAdapter(connection(), { fetch, sleep });
		await expect(adapter.createIssue({ teamId: 'team-id', title: 'Title' })).rejects.toBeInstanceOf(Error);
		await expect(adapter.updateIssue({ id: 'DEMO-1', title: 'Title' })).rejects.toBeInstanceOf(Error);
		await expect(adapter.createComment({ issueId: 'DEMO-1', body: 'Body' })).rejects.toBeInstanceOf(Error);
		expect(fetch).toHaveBeenCalledTimes(3);
		expect(sleep).not.toHaveBeenCalled();
		await adapter.close();
	});
	test('content-length, malformed JSON, partial GraphQL errors and failed mutation acknowledgements are sanitized', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(json({ data: { viewer } }, 200, { 'content-length': '99999999' }))
			.mockResolvedValueOnce(new Response('upstream-secret'))
			.mockResolvedValueOnce(json({ data: { viewer }, errors: [{ message: 'upstream-secret' }] }))
			.mockResolvedValueOnce(json({ data: { issueCreate: { success: false, issue: issue() } } }));
		const adapter = createLinearHttpAdapter(connection(), { fetch });
		for (let index = 0; index < 3; index++) await expect(adapter.getViewer()).rejects.toMatchObject({ message: 'Linear service operation failed' });
		await expect(adapter.createIssue({ teamId: 'team-id', title: 'Title' })).rejects.toMatchObject({ message: 'Linear service operation failed' });
		await adapter.close();
	});
});
