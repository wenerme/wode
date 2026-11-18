import { describe, expect, it, vi } from 'vitest';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { ApolloCliDefinition } from './cli';
import { createApolloTestAdapter } from './core/adapter.fixture';
import { ApolloConnectionConfigSchema } from './core/config';
import { createApolloService } from './core/createApolloService';
import { ApolloServiceProvider } from './index';

const options = {
	appId: 'app',
	namespace: 'ns',
	operator: 'operator',
	config: { baseUrl: 'https://config.example.test' },
	admin: { baseUrl: 'https://admin.example.test' },
	portal: { baseUrl: 'https://portal.example.test' },
};
const base = '/apps/app/envs/DEV/clusters/default/namespaces/ns';
function pendingFetch() {
	return vi.fn<typeof globalThis.fetch>(async (input, init) => {
		const path = new URL(String(input)).pathname;
		if (path === base)
			return Response.json({
				baseInfo: { id: 1 },
				format: 'properties',
				items: [{ item: { key: 'db.password', value: 'fixture-secret' } }],
			});
		if (path === `${base}/releases/active`) return Response.json([]);
		if (path.includes('/permissions/') || path.includes('/ns_permissions/'))
			return Response.json({ hasPermission: true });
		if (path === '/user') return Response.json({ userId: 'operator' });
		if (path === `${base}/releases` && init?.method === 'POST') return Response.json({ id: 10 });
		return Response.json({ password: 'fixture-secret', state: 'ok' });
	});
}
async function transport(fetch: typeof globalThis.fetch, readOnly = true) {
	const config = { provider: 'apollo', options, readOnly };
	return createServiceProviderAdapter(ApolloServiceProvider).create({
		name: 'apollo',
		config,
		context: { services: { apollo: config } },
		fetch,
	});
}

describe('Apollo contract call path', () => {
	it('preserves Portal, Admin and pending diff values through registered operations', async () => {
		const fetch = pendingFetch();
		const client = await transport(fetch);
		try {
			const signal = new AbortController().signal;
			await expect(client.call('getStatus', undefined, { signal })).resolves.toEqual({
				password: 'fixture-secret',
				state: 'ok',
			});
			await expect(client.call('listApp', undefined, { signal })).resolves.toEqual({
				password: 'fixture-secret',
				state: 'ok',
			});
			await expect(client.call('diffNamespaceRelease', undefined, { signal })).resolves.toMatchObject({
				count: 1,
				changes: [{ key: 'db.password', op: 'create', newValue: 'fixture-secret' }],
			});
			for (const [, init] of fetch.mock.calls) expect(init?.signal).toBe(signal);
		} finally {
			await client.close?.();
		}
	});

	it('retains the local Portal release preview while refusing real writes on a read-only instance', async () => {
		const fetch = pendingFetch();
		const service = createApolloService(options, { fetch });
		await expect(service.publishNamespaceRelease({ dryRun: true })).resolves.toMatchObject({
			dryRun: true,
			published: false,
			count: 1,
			permission: { user: 'operator', release: true },
		});
		expect(fetch.mock.calls.every(([, init]) => init?.method === 'GET')).toBe(true);
		const reads = fetch.mock.calls.length;
		await expect(service.publishNamespaceRelease()).rejects.toThrow('read-only');
		expect(fetch.mock.calls).toHaveLength(reads);
		await service.close();
	});

	it('permits only the explicit supported dry-run at the read-only operation boundary', async () => {
		const fetch = pendingFetch();
		const client = await transport(fetch);
		try {
			await expect(client.call('publishNamespaceRelease', {})).rejects.toThrow('read-only');
			await expect(client.call('request', { path: '/apps', dryRun: true })).rejects.toThrow('read-only');
			expect(fetch).not.toHaveBeenCalled();
			await expect(client.call('publishNamespaceRelease', { dryRun: true })).resolves.toMatchObject({
				dryRun: true,
				published: false,
			});
			expect(fetch.mock.calls.every(([, init]) => init?.method === 'GET')).toBe(true);
			const reads = fetch.mock.calls.length;
			await expect(client.call('publishNamespaceRelease', { dryRun: false })).rejects.toThrow('read-only');
			await expect(client.call('publishNamespaceRelease', { dryRun: 'true' })).rejects.toThrow('read-only');
			expect(fetch.mock.calls).toHaveLength(reads);
		} finally {
			await client.close?.();
		}
	});

	it('publishes through the existing Portal protocol with an isolated call signal', async () => {
		const fetch = pendingFetch();
		const service = createApolloService({ ...options, readOnly: false }, { fetch });
		const signal = new AbortController().signal;
		await expect(service.publishNamespaceRelease({ title: 'release' }, { signal })).resolves.toMatchObject({
			published: true,
			release: { id: 10 },
		});
		const writes = fetch.mock.calls.filter(([, init]) => init?.method !== 'GET');
		expect(writes).toHaveLength(1);
		expect(new URL(String(writes[0]?.[0])).pathname).toBe(`${base}/releases`);
		expect(writes[0]?.[1]?.signal).toBe(signal);
		await service.close();
	});

	it.each([
		{
			format: 'raw' as const,
			namespace: 'ns',
			response: () => new Response('password=fixture-secret\n'),
			expected: 'password=fixture-secret\n',
		},
		{
			format: 'properties' as const,
			namespace: 'ns',
			response: () => Response.json({ password: 'fixture-secret', count: '2' }),
			expected: 'password=fixture-secret\ncount=2',
		},
		{
			format: 'json' as const,
			namespace: 'ns',
			response: () => Response.json({ password: 'fixture-secret' }),
			expected: { password: 'fixture-secret' },
		},
		{
			format: 'config' as const,
			namespace: 'ns',
			response: () => Response.json({ appId: 'app', configurations: { password: 'fixture-secret' }, releaseKey: 'r1' }),
			expected: { appId: 'app', configurations: { password: 'fixture-secret' }, releaseKey: 'r1' },
		},
		{
			format: 'content' as const,
			namespace: 'file.yaml',
			response: () => Response.json({ content: 'password: fixture-secret\n' }),
			expected: 'password: fixture-secret\n',
		},
		{
			format: 'data' as const,
			namespace: 'file.json',
			response: () => Response.json({ content: '{"password":"fixture-secret","enabled":true}' }),
			expected: { password: 'fixture-secret', enabled: true },
		},
	])(
		'preserves original configuration $format output through the operation path',
		async ({ format, namespace, response, expected }) => {
			const fetch = vi.fn<typeof globalThis.fetch>(async () => response());
			const client = await transport(fetch);
			try {
				const signal = new AbortController().signal;
				await expect(client.call('readConfig', { format, namespace }, { signal })).resolves.toEqual(expected);
				expect(fetch).toHaveBeenCalledTimes(1);
				expect(fetch.mock.calls[0]?.[1]?.signal).toBe(signal);
			} finally {
				await client.close?.();
			}
		},
	);

	it('keeps configuration values usable when a read is passed back to a write operation', async () => {
		const values = { password: 'fixture-secret', replica: 'app:fixture-password@tcp(db.example.test:3306)/sample' };
		const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) =>
			new URL(String(input)).origin === options.config.baseUrl
				? Response.json(values)
				: Response.json({ ok: init?.method === 'PUT' }),
		);
		const client = await transport(fetch, false);
		try {
			const data = (await client.call('readConfig', { format: 'json' })) as typeof values;
			expect(data).toEqual(values);
			await client.call('upsertItem', { key: 'db.password', value: data.password });
			const write = fetch.mock.calls.find(([, init]) => init?.method === 'PUT');
			expect(JSON.parse(String(write?.[1]?.body))).toMatchObject({ key: 'db.password', value: values.password });
		} finally {
			await client.close?.();
		}
	});
});

describe('Apollo per-call cancellation and close', () => {
	it('rejects already aborted config/Portal/Admin/raw/patch calls before transport', async () => {
		const fetch = pendingFetch();
		const service = createApolloService({ ...options, readOnly: false }, { fetch });
		const controller = new AbortController();
		const reason = new Error('cancelled before call');
		controller.abort(reason);
		const callOptions = { signal: controller.signal };
		for (const run of [
			() => service.readConfig(undefined, callOptions),
			() => service.getStatus(undefined, callOptions),
			() => service.listApp(undefined, callOptions),
			() => service.request({ path: '/apps' }, callOptions),
			() => service.patchNamespaceItem({ set: [{ key: 'a', value: 'b' }], dryRun: true }, callOptions),
		]) {
			await expect(Promise.resolve().then(run)).rejects.toBe(reason);
		}
		expect(fetch).not.toHaveBeenCalled();
		await service.close();
	});

	it('propagates an in-flight abort to the HTTP request and keeps concurrent call signals independent', async () => {
		let entered!: () => void;
		const started = new Promise<void>((resolve) => {
			entered = resolve;
		});
		const cancelled = new AbortController();
		const other = new AbortController();
		const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
			if (new URL(String(input)).pathname === '/health') {
				entered();
				return new Promise<Response>((_resolve, reject) =>
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true }),
				);
			}
			expect(init?.signal).toBe(other.signal);
			return Response.json([]);
		});
		const service = createApolloService(options, { fetch });
		const call = service.getStatus(undefined, { signal: cancelled.signal });
		const rejection = expect(call).rejects.toBeInstanceOf(Error);
		await started;
		await expect(service.listApp(undefined, { signal: other.signal })).resolves.toEqual([]);
		cancelled.abort(new Error('stop health'));
		await rejection;
		expect(other.signal.aborted).toBe(false);
		await service.close();
	});

	it('does not swallow cancellation as an unknown best-effort permission answer', async () => {
		const controller = new AbortController();
		const reason = new Error('stop permission preview');
		const normal = pendingFetch();
		const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
			if (new URL(String(input)).pathname.includes('/permissions/')) {
				controller.abort(reason);
				throw reason;
			}
			return normal(input, init);
		});
		const service = createApolloService(options, { fetch });
		await expect(service.publishNamespaceRelease({ dryRun: true }, { signal: controller.signal })).rejects.toBe(reason);
		expect(fetch.mock.calls.every(([, init]) => init?.method === 'GET')).toBe(true);
		await service.close();
	});

	it('combines endpoint timeouts with call cancellation, including config reads and Portal login retry', async () => {
		const signal = new AbortController().signal;
		const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
			expect(init?.signal).toBeInstanceOf(AbortSignal);
			expect(init?.signal).not.toBe(signal);
			const path = new URL(String(input)).pathname;
			if (path === '/signin')
				return new Response(null, { status: 302, headers: { 'set-cookie': 'session=fixture; Path=/' } });
			if (path === '/health' && !new Headers(init?.headers).has('cookie'))
				return new Response(null, { status: 302, headers: { location: '/signin' } });
			return Response.json({ safe: 'value' });
		});
		const service = createApolloService(
			{
				...options,
				config: { ...options.config, requestTimeoutMs: 1000 },
				admin: { ...options.admin, requestTimeoutMs: 1000 },
				portal: {
					...options.portal,
					requestTimeoutMs: 1000,
					auth: { type: 'basic', username: 'fixture', password: 'fixture' },
				},
			},
			{ fetch },
		);
		await service.readConfig(undefined, { signal });
		await service.listApp(undefined, { signal });
		await service.getStatus(undefined, { signal });
		expect(fetch).toHaveBeenCalledTimes(5);
		await service.close();
	});

	it('closes the existing adapter once and rejects later calls without inventing a disposable protocol', async () => {
		const close = vi.fn(async () => {});
		const request = vi.fn(async () => ({}));
		const readConfig = vi.fn(async () => ({}));
		const service = createApolloService(ApolloConnectionConfigSchema.parse(options), {
			createAdapter: () => createApolloTestAdapter({ request, readConfig, close }),
		});
		await Promise.all([service.close(), service.close()]);
		expect(close).toHaveBeenCalledTimes(1);
		await expect(service.getStatus()).rejects.toThrow('closed');
		await expect(service.readConfig()).rejects.toThrow('closed');
		expect(request).not.toHaveBeenCalled();
		expect(readConfig).not.toHaveBeenCalled();
	});
});

describe('Apollo typed CLI compatibility', () => {
	it('retains confirmation, supported dry-run discovery, original values and call options', async () => {
		const publish = ApolloCliDefinition.commands.find(
			(command) => command.group === 'release' && command.name === 'publish',
		)!;
		expect(publish.mutating).toBe(true);
		expect(publish.supportsDryRun).toBe(true);
		const context = { args: [], options: { 'dry-run': true }, readText: vi.fn() };
		await expect(publish.prepare(context)).rejects.toThrow('--yes');
		const invoke = await publish.prepare({ ...context, options: { ...context.options, yes: true } });
		const fetch = pendingFetch();
		const service = createApolloService(options, { fetch });
		const signal = new AbortController().signal;
		await expect(invoke(service, { signal })).resolves.toMatchObject({
			dryRun: true,
			published: false,
			changes: [{ key: 'db.password', newValue: 'fixture-secret' }],
		});
		for (const [, init] of fetch.mock.calls) expect(init?.signal).toBe(signal);
		expect(fetch.mock.calls.every(([, init]) => init?.method === 'GET')).toBe(true);
		await service.close();
	});

	it('keeps prepared operation results original when the caller requests a display projection', async () => {
		const publish = ApolloCliDefinition.commands.find(
			(command) => command.group === 'release' && command.name === 'publish',
		)!;
		const invoke = await publish.prepare({
			args: [],
			options: { 'dry-run': true, yes: true, redact: true },
			readText: vi.fn(),
		});
		const fetch = pendingFetch();
		const service = createApolloService(options, { fetch });
		try {
			await expect(invoke(service, {})).resolves.toMatchObject({
				changes: [{ key: 'db.password', newValue: 'fixture-secret' }],
			});
		} finally {
			await service.close();
		}
	});
});
