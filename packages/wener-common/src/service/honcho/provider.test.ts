import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { ServiceRegistry } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { HonchoServiceCapability, HonchoServiceContract, HonchoServiceProvider } from './index';

type Call = { url: string; method?: string; body?: unknown; headers: Headers };

function setup({ readOnly = true, options = { apiKeyEnv: 'HONCHO_FIXTURE_KEY', workspaceId: 'ws', peerId: 'me' } as Record<string, unknown>, response = (): unknown => ({}) } = {}) {
	const calls: Call[] = [];
	const getEnv = vi.fn((name: string) => (name === 'HONCHO_FIXTURE_KEY' ? 'fixture-key' : undefined));
	const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
		calls.push({
			url: String(input), method: init.method, headers: new Headers(init.headers),
			body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
		});
		return Response.json(response());
	});
	const services = normalizeCliServices([{ name: 'mem', type: 'honcho', readOnly, baseUrl: 'https://honcho.example.test', options }]);
	const registry = new ServiceRegistry({ context: { services }, fetch: fetch as unknown as typeof globalThis.fetch, getEnv });
	registry.register(HonchoServiceProvider);
	const runtime = createServiceRuntime({
		context: { services },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(HonchoServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { calls, fetch, getEnv, registry, runtime };
}

describe('Honcho service provider', () => {
	it('discovers schema without env or network access', async () => {
		const test = setup();
		const schema = await test.runtime.getSchema({ params: { service: 'mem' } });
		expect(Object.keys(schema.tools)).toEqual(Object.keys(HonchoServiceContract));
		expect(schema.tools.query.annotations?.readOnlyHint).toBe(true);
		expect(schema.tools.remember.annotations?.readOnlyHint).toBe(false);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('rejects invalid input before credentials or HTTP', async () => {
		const test = setup();
		await expect(test.runtime.call({ params: { service: 'mem' }, body: { toolName: 'query', input: { query: '' } } })).rejects.toThrow();
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('queries conclusions with configured defaults and bearer auth', async () => {
		const test = setup({ response: () => [{ id: 'c1', content: 'likes tea', observer_id: 'me', observed_id: 'me' }] });
		const service = await test.registry.load(HonchoServiceCapability, 'mem');
		const result = await service.query({ query: 'tea' });
		expect(result).toEqual([{ id: 'c1', content: 'likes tea', observer_id: 'me', observed_id: 'me' }]);
		expect(test.calls[0]).toMatchObject({ url: 'https://honcho.example.test/v3/workspaces/ws/conclusions/query', method: 'POST' });
		expect(test.calls[0]!.body).toEqual({ query: 'tea', top_k: 20, filters: { observer_id: 'me', observed_id: 'me' } });
		expect(test.calls[0]!.headers.get('authorization')).toBe('Bearer fixture-key');
		await test.registry.close();
	});

	it('normalizes list pages and chat output', async () => {
		const test = setup({ response: () => ({ items: [{ id: 's1' }], total: 1, page: 1 }) });
		const service = await test.registry.load(HonchoServiceCapability, 'mem');
		expect(await service.listSession({ size: 10, workspaceId: 'other' })).toEqual({ items: [{ id: 's1' }], total: 1, page: 1 });
		expect(test.calls[0]!.url).toBe('https://honcho.example.test/v3/workspaces/other/sessions/list?size=10');
		expect(await service.chat({ query: 'hi' })).toMatchObject({ content: '' });
		expect(test.calls[1]!.body).toEqual({ query: 'hi', target: 'me', reasoning_level: 'low', stream: false });
		await test.registry.close();
	});

	it.each([
		['remember', { sessionId: 's', content: 'x' }],
		['createWorkspace', {}],
		['createPeer', { id: 'p' }],
		['createSession', { id: 's' }],
		['request', { path: '/workspaces', method: 'POST', body: {} }],
	] as const)('refuses %s when read-only without HTTP', async (toolName, input) => {
		const test = setup();
		await expect(test.runtime.call({ params: { service: 'mem' }, body: { toolName, input } })).rejects.toThrow('read-only');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('refuses typed writes and every raw request on a read-only service without HTTP', async () => {
		const test = setup();
		const service = await test.registry.load(HonchoServiceCapability, 'mem');
		const attempts = [
			() => service.remember({ sessionId: 's', content: 'x' }),
			() => service.createSession({ id: 's' }),
			() => service.request({ path: '/workspaces', method: 'POST', body: {} }),
			() => service.request({ path: '/workspaces/ws', method: 'DELETE' }),
			() => service.request({ path: '/workspaces/ws/queue/status' }),
		];
		for (const attempt of attempts) await expect(attempt()).rejects.toThrow('Selected service is read-only');
		expect(test.fetch).toHaveBeenCalledTimes(0);
		await test.registry.close();
	});

	it('sends raw requests when writable and rejects GET/HEAD bodies via the service API', async () => {
		const test = setup({ readOnly: false, response: () => ({ ok: true }) });
		const service = await test.registry.load(HonchoServiceCapability, 'mem');
		expect(await service.request({ path: '/workspaces/ws/queue/status' })).toEqual({ ok: true });
		expect(test.calls[0]!.method).toBe('GET');
		for (const method of ['GET', 'HEAD'] as const)
			await expect(test.runtime.call({ params: { service: 'mem' }, body: { toolName: 'request', input: { path: '/x', method, body: {} } } })).rejects.toThrow();
		expect(test.fetch).toHaveBeenCalledTimes(1);
		await test.registry.close();
		await test.runtime.close();
	});

	it('writes a message when writable', async () => {
		const test = setup({ readOnly: false, response: () => [{ id: 'm1', peer_id: 'me', session_id: 's', content: 'hello' }] });
		const service = await test.registry.load(HonchoServiceCapability, 'mem');
		expect(await service.remember({ sessionId: 's', content: 'hello', metadata: { source: 'test' } })).toMatchObject({ id: 'm1' });
		expect(test.calls[0]!.url).toBe('https://honcho.example.test/v3/workspaces/ws/sessions/s/messages');
		expect(test.calls[0]!.body).toEqual({ messages: [{ peer_id: 'me', content: 'hello', metadata: { source: 'test' } }] });
		await service.createSession({ id: 's2', peers: ['me'] });
		expect(test.calls[1]!.body).toEqual({ id: 's2', peers: { me: {} } });
		await test.registry.close();
	});

	it('requires a workspace and rejects calls after close', async () => {
		const test = setup({ options: {} });
		const service = await test.registry.load(HonchoServiceCapability, 'mem');
		await expect(service.listPeer({})).rejects.toThrow('workspaceId is required');
		await service.close();
		await expect(service.systemStatus({ workspaceId: 'ws' })).rejects.toThrow('closed');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.registry.close();
	});

	it('rejects conflicting or missing credentials on load', async () => {
		const conflict = setup({ options: { apiKey: 'a', apiKeyEnv: 'HONCHO_FIXTURE_KEY' } });
		await expect(conflict.registry.load(HonchoServiceCapability, 'mem')).rejects.toThrow();
		const missing = setup({ options: { apiKeyEnv: 'HONCHO_MISSING' } });
		await expect(missing.registry.load(HonchoServiceCapability, 'mem')).rejects.toThrow();
		expect(conflict.fetch).not.toHaveBeenCalled();
	});

	it('aborts through options.signal', async () => {
		const test = setup();
		test.fetch.mockImplementation((_input, init: RequestInit = {}) => new Promise((_, reject) => {
			init.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
		}));
		const service = await test.registry.load(HonchoServiceCapability, 'mem');
		const controller = new AbortController();
		const pending = service.listPeer({}, { signal: controller.signal });
		controller.abort(new Error('stop'));
		await expect(pending).rejects.toThrow('stop');
		await test.registry.close();
	});
});
