import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { ServiceRegistry } from '../registry';
import { TencentClsServiceCapability, TencentClsServiceOptionsSchema, TencentClsServiceProvider } from './index';

function runtime(
	options: Record<string, unknown> = { clientIdEnv: 'CLS_FIXTURE_ID', clientSecretEnv: 'CLS_FIXTURE_SECRET' },
	readOnly = true,
) {
	const getEnv = vi.fn((name: string) => {
		if (name === 'CLS_FIXTURE_ID') return 'fixture-id';
		if (name === 'CLS_FIXTURE_SECRET') return 'fixture-secret';
		return undefined;
	});
	const fetch = vi.fn<FetchLike>(async (input) => {
		const url = typeof input === 'string' ? input : input.toString();
		if (url.includes('cls.')) {
			// Dispatch is determined by the X-TC-Action header set in TencentLogClient#request;
			// mimic both SearchLog and DescribeTopics responses by shape of the request body.
			return Response.json({ Response: { RequestId: 'req-1', Topics: [], TotalCount: 0, Results: [], Context: '', ListOver: true } });
		}
		return Response.json({ Response: { RequestId: 'req-1' } });
	});
	const service = normalizeCliServices([{ name: 'logs', type: 'cls', readOnly, options }]);
	const runtime = createServiceRuntime({
		context: { services: service },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(TencentClsServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { runtime, fetch, getEnv };
}

async function directService(fetch: typeof globalThis.fetch) {
	const services = normalizeCliServices([
		{ name: 'logs', type: 'cls', readOnly: true, options: { clientIdEnv: 'ID', clientSecretEnv: 'SECRET' } },
	]);
	const registry = new ServiceRegistry({
		context: { services },
		fetch,
		getEnv: (name) => name === 'ID' ? 'fixture-id' : name === 'SECRET' ? 'fixture-secret' : undefined,
	});
	registry.register(TencentClsServiceProvider);
	return { registry, service: await registry.load(TencentClsServiceCapability, 'logs') };
}

describe('Tencent CLS service options schema', () => {
	it('requires clientIdEnv and clientSecretEnv', () => {
		expect(TencentClsServiceOptionsSchema.safeParse({}).success).toBe(false);
		expect(TencentClsServiceOptionsSchema.safeParse({ clientIdEnv: 'A' }).success).toBe(false);
		expect(TencentClsServiceOptionsSchema.safeParse({ clientIdEnv: 'A', clientSecretEnv: 'B' }).success).toBe(true);
	});

	it('rejects unknown properties', () => {
		expect(
			TencentClsServiceOptionsSchema.safeParse({ clientIdEnv: 'A', clientSecretEnv: 'B', extra: true }).success,
		).toBe(false);
	});
});

describe('Tencent CLS service provider', () => {
	it('discovers a complete read-only schema without env or network access', async () => {
		const test = runtime();
		const schema = await test.runtime.getSchema({ params: { service: 'logs' } });
		expect(Object.keys(schema.tools)).toEqual(['query', 'listTopic']);
		expect(schema.tools.query.annotations?.readOnlyHint).toBe(true);
		expect(schema.tools.listTopic.annotations?.readOnlyHint).toBe(true);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('rejects a writable configuration before credentials or HTTP', async () => {
		const test = runtime(undefined, false);
		await expect(
			test.runtime.call({ params: { service: 'logs' }, body: { toolName: 'listTopic', input: {} } }),
		).rejects.toThrow('Failed to create service');
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('resolves env only on dispatch and routes listTopic', async () => {
		const test = runtime();
		const result = await test.runtime.call({ params: { service: 'logs' }, body: { toolName: 'listTopic', input: {} } });
		expect(result).toMatchObject({ Topics: [], TotalCount: 0 });
		expect(test.getEnv).toHaveBeenCalledWith('CLS_FIXTURE_ID');
		expect(test.getEnv).toHaveBeenCalledWith('CLS_FIXTURE_SECRET');
		await test.runtime.close();
	});

	it('maps native cancellation and timeout context to the underlying Tencent CLS request', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
			expect(init?.signal).toBeInstanceOf(AbortSignal);
			return Response.json({ Response: { RequestId: 'req-1', TotalCount: 0, Topics: [] } });
		});
		const services = normalizeCliServices([
			{ name: 'logs', type: 'cls', readOnly: true, options: { clientIdEnv: 'ID', clientSecretEnv: 'SECRET' } },
		]);
		const registry = new ServiceRegistry({
			context: { services },
			fetch,
			getEnv: (name) => name === 'ID' ? 'fixture-id' : name === 'SECRET' ? 'fixture-secret' : undefined,
		});
		registry.register(TencentClsServiceProvider);
		const service = await registry.load(TencentClsServiceCapability, 'logs');
		const controller = new AbortController();
		await service.listTopic(undefined, { signal: controller.signal });
		expect(fetch.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
		await expect(service.listTopic(undefined, { context: { timeoutMs: 0 } })).rejects.toThrow('Invalid Tencent CLS timeout');
		await registry.close();
	});

	it('keeps the timeout active until the final DescribeTopics request completes', async () => {
		const signals: AbortSignal[] = [];
		const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
			const signal = init?.signal;
			if (!signal) throw new Error('Missing CLS request signal');
			signals.push(signal);
			await new Promise<void>((resolve, reject) => {
				const timer = setTimeout(resolve, 50);
				const abort = () => {
					clearTimeout(timer);
					signal.removeEventListener('abort', abort);
					reject(signal.reason ?? Object.assign(new Error('ABORTED'), { code: 'ABORTED' }));
				};
				if (signal.aborted) abort();
				else signal.addEventListener('abort', abort, { once: true });
			});
			return Response.json({ Response: { RequestId: 'req-1', TotalCount: 0, Topics: [] } });
		});
		const { registry, service } = await directService(fetch);
		await expect(service.listTopic(undefined, { context: { timeoutMs: 5 } })).rejects.toMatchObject({ code: 'TIMEOUT' });
		expect(signals).toHaveLength(1);
		expect(signals[0]?.aborted).toBe(true);
		await registry.close();
	});

	it('keeps the timeout active until the final SearchLog request completes', async () => {
		const signals: AbortSignal[] = [];
		const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
			const signal = init?.signal;
			if (!signal) throw new Error('Missing CLS request signal');
			signals.push(signal);
			await new Promise<void>((resolve, reject) => {
				const timer = setTimeout(resolve, 50);
				const abort = () => {
					clearTimeout(timer);
					signal.removeEventListener('abort', abort);
					reject(signal.reason ?? Object.assign(new Error('ABORTED'), { code: 'ABORTED' }));
				};
				if (signal.aborted) abort();
				else signal.addEventListener('abort', abort, { once: true });
			});
			return Response.json({ Response: { RequestId: 'req-1', Context: '', ListOver: true, Results: [] } });
		});
		const { registry, service } = await directService(fetch);
		await expect(
			service.query(
				{ topic: ['11111111-1111-1111-1111-111111111111'], query: '*', from: 0, to: 1 },
				{ context: { timeoutMs: 5 } },
			),
		).rejects.toMatchObject({ code: 'TIMEOUT' });
		expect(signals).toHaveLength(1);
		expect(signals[0]?.aborted).toBe(true);
		await registry.close();
	});


	it('fails to create when clientIdEnv is unavailable', async () => {
		const test = runtime({ clientIdEnv: 'MISSING', clientSecretEnv: 'CLS_FIXTURE_SECRET' });
		await expect(
			test.runtime.call({ params: { service: 'logs' }, body: { toolName: 'listTopic', input: {} } }),
		).rejects.toThrow('Failed to create service');
		await test.runtime.close();
	});
});

describe('Tencent CLS query topic resolution', () => {
	it('resolves names independently and preserves explicit IDs when the named topic is absent from the fallback first page', async () => {
		const explicitId = '11111111-1111-1111-1111-111111111111';
		const namedId = '33333333-3333-3333-3333-333333333333';
		const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
			const body = JSON.parse(init?.body as string);
			if (new Headers(init?.headers).get('X-TC-Action') === 'DescribeTopics') {
				// CLS combines different filters. Only the independent name lookup finds
				// this topic; the unfiltered fallback page deliberately excludes it.
				const matches = body.Filters?.length === 1 && body.Filters[0].Key === 'topicName'
					&& body.Filters[0].Values.includes('outside-first-page');
				return Response.json({ Response: {
					RequestId: 'req-1', TotalCount: 200,
					Topics: matches ? [{ TopicId: namedId, TopicName: 'outside-first-page' }] : [],
				} });
			}
			return Response.json({ Response: { RequestId: 'req-1', Context: '', ListOver: true, Results: [] } });
		});
		const { registry, service } = await directService(fetch);
		try {
			await service.query({ topic: [explicitId, 'outside-first-page'], query: '*', from: 0, to: 1 });
			const listCalls = fetch.mock.calls.filter(([, init]) => new Headers(init?.headers).get('X-TC-Action') === 'DescribeTopics');
			expect(listCalls).toHaveLength(1);
			expect(JSON.parse(listCalls[0]?.[1]?.body as string)).toEqual({
				Filters: [{ Key: 'topicName', Values: ['outside-first-page'] }], PreciseSearch: 1,
			});
			const searchCall = fetch.mock.calls.find(([, init]) => new Headers(init?.headers).get('X-TC-Action') === 'SearchLog');
			expect(searchCall).toBeDefined();
			const search = JSON.parse(searchCall?.[1]?.body as string);
			expect(search.TopicId).toBeUndefined();
			expect(search.Topics).toEqual([{ TopicId: explicitId }, { TopicId: namedId }]);
		} finally {
			await registry.close();
		}
	});

	function topicRuntime(listTopicResponse: unknown[]) {
		const getEnv = vi.fn((name: string) => (name === 'ID' ? 'fixture-id' : name === 'SECRET' ? 'fixture-secret' : undefined));
		const fetch = vi.fn<FetchLike>(async (_input, init) => {
			const body = init?.body ? JSON.parse(init.body as string) : {};
			const action = (init?.headers as Record<string, string> | undefined)?.['X-TC-Action'];
			if (action === 'DescribeTopics') {
				return Response.json({ Response: { RequestId: 'req-1', TotalCount: listTopicResponse.length, Topics: listTopicResponse } });
			}
			return Response.json({
				Response: { RequestId: 'req-1', Context: '', ListOver: true, Results: [], TopicId: body.TopicId, Topics: body.Topics },
			});
		});
		const service = normalizeCliServices([
			{ name: 'logs', type: 'cls', readOnly: true, options: { clientIdEnv: 'ID', clientSecretEnv: 'SECRET' } },
		]);
		const runtime = createServiceRuntime({
			context: { services: service },
			providers: new ServiceProviderRegistry([createServiceProviderAdapter(TencentClsServiceProvider)]),
			fetch: fetch as unknown as typeof globalThis.fetch,
			getEnv,
		});
		return { runtime, fetch };
	}

	it('throws when no topic matches', async () => {
		const test = topicRuntime([]);
		await expect(
			test.runtime.call({
				params: { service: 'logs' },
				body: { toolName: 'query', input: { topic: ['no-such-topic'], query: '*', from: 0, to: 1 } },
			}),
		).rejects.toThrow();
		await test.runtime.close();
	});

	it('uses TopicId when a single topic ID is given', async () => {
		const test = topicRuntime([]);
		await test.runtime.call({
			params: { service: 'logs' },
			body: {
				toolName: 'query',
				input: { topic: ['11111111-1111-1111-1111-111111111111'], query: '*', from: 0, to: 1 },
			},
		});
		const searchCall = test.fetch.mock.calls.find(
			(call) => (call[1]?.headers as Record<string, string>)?.['X-TC-Action'] === 'SearchLog',
		);
		const body = JSON.parse(searchCall?.[1]?.body as string);
		expect(body.TopicId).toBe('11111111-1111-1111-1111-111111111111');
		expect(body.Topics).toBeUndefined();
		await test.runtime.close();
	});

	it('uses Topics when multiple topic IDs are given', async () => {
		const test = topicRuntime([]);
		await test.runtime.call({
			params: { service: 'logs' },
			body: {
				toolName: 'query',
				input: {
					topic: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
					query: '*',
					from: 0,
					to: 1,
				},
			},
		});
		const searchCall = test.fetch.mock.calls.find(
			(call) => (call[1]?.headers as Record<string, string>)?.['X-TC-Action'] === 'SearchLog',
		);
		const body = JSON.parse(searchCall?.[1]?.body as string);
		expect(body.TopicId).toBeUndefined();
		expect(body.Topics).toEqual([
			{ TopicId: '11111111-1111-1111-1111-111111111111' },
			{ TopicId: '22222222-2222-2222-2222-222222222222' },
		]);
		await test.runtime.close();
	});

	it('resolves a topic name via listTopic before searching', async () => {
		const test = topicRuntime([{ TopicId: '33333333-3333-3333-3333-333333333333', TopicName: 'my-topic' }]);
		await test.runtime.call({
			params: { service: 'logs' },
			body: { toolName: 'query', input: { topic: ['my-topic'], query: '*', from: 0, to: 1 } },
		});
		const searchCall = test.fetch.mock.calls.find(
			(call) => (call[1]?.headers as Record<string, string>)?.['X-TC-Action'] === 'SearchLog',
		);
		const body = JSON.parse(searchCall?.[1]?.body as string);
		expect(body.TopicId).toBe('33333333-3333-3333-3333-333333333333');
		await test.runtime.close();
	});
});
