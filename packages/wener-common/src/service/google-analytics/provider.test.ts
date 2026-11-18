import type { FetchLike } from '@wener/utils';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCliServices } from '../config';
import { ServiceRegistry } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { GoogleAnalyticsServiceCapability, GoogleAnalyticsServiceProvider } from './index';

function setup(options: Record<string, unknown> = { accessTokenEnv: 'GA_FIXTURE_TOKEN' }, readOnly = true, body: unknown = { accountSummaries: [] }) {
	const getEnv = vi.fn((name: string) => (name === 'GA_FIXTURE_TOKEN' ? 'fixture-token' : undefined));
	const fetch = vi.fn<FetchLike>(async () => Response.json(body));
	const services = normalizeCliServices([{ name: 'analytics', type: 'ga', readOnly, options }]);
	const runtime = createServiceRuntime({
		context: { services },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(GoogleAnalyticsServiceProvider)]),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv,
	});
	return { runtime, fetch, getEnv };
}

describe('Google Analytics service provider', () => {
	it('discovers a read-only schema without env or network access', async () => {
		const test = setup();
		const schema = await test.runtime.getSchema({ params: { service: 'analytics' } });
		expect(Object.keys(schema.tools)).toEqual(['listAccountSummaries', 'getProperty', 'getMetadata', 'runReport', 'runRealtimeReport']);
		for (const tool of Object.values(schema.tools)) expect(tool.annotations?.readOnlyHint).toBe(true);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});

	it('resolves credentials at call time and applies the input default', async () => {
		const test = setup();
		const result = await test.runtime.call({ params: { service: 'analytics' }, body: { toolName: 'listAccountSummaries', input: undefined } });
		expect(result).toEqual({ accountSummaries: [] });
		expect(test.getEnv).toHaveBeenCalledWith('GA_FIXTURE_TOKEN');
		const [url, init] = test.fetch.mock.calls[0]!;
		expect(String(url)).toBe('https://analyticsadmin.googleapis.com/v1beta/accountSummaries');
		expect(new Headers(init?.headers).get('authorization')).toBe('Bearer fixture-token');
		await test.runtime.close();
	});

	it('maps context timeout through the typed registry', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() => new Promise(() => undefined));
		const services = normalizeCliServices([{ name: 'analytics', type: 'google-analytics', options: { accessToken: 'fixture' } }]);
		const registry = new ServiceRegistry({ context: { services }, fetch });
		registry.register(GoogleAnalyticsServiceProvider);
		const service = await registry.load(GoogleAnalyticsServiceCapability, 'analytics');
		await expect(service.getProperty({ propertyId: '1' }, { context: { timeoutMs: 5 } })).rejects.toMatchObject({ code: 'TIMEOUT' });
		await registry.close();
	});

	it('returns redacted configuration errors', async () => {
		for (const options of [{}, { accessToken: 'super-secret-value', accessTokenEnv: 'GA_FIXTURE_TOKEN' }, { accessToken: 'super-secret-value', unknown: 1 }]) {
			const test = setup(options);
			const error = await test.runtime.call({ params: { service: 'analytics' }, body: { toolName: 'getProperty', input: { propertyId: '1' } } }).catch((e: unknown) => e);
			expect(error).toBeInstanceOf(Error);
			expect(String((error as Error).message)).not.toContain('super-secret-value');
			expect(test.fetch).not.toHaveBeenCalled();
			await test.runtime.close();
		}
		const missing = setup({ serviceAccountJsonEnv: 'GA_MISSING' });
		const error = await missing.runtime.call({ params: { service: 'analytics' }, body: { toolName: 'getProperty', input: { propertyId: '1' } } }).catch((e: unknown) => e);
		expect(String((error as Error).message)).not.toContain('GA_MISSING');
		expect(missing.fetch).not.toHaveBeenCalled();
		await missing.runtime.close();
	});

	it('rejects writable configuration and malformed supplier output', async () => {
		const writable = setup(undefined, false);
		await expect(writable.runtime.call({ params: { service: 'analytics' }, body: { toolName: 'getProperty', input: { propertyId: '1' } } })).rejects.toThrow();
		expect(writable.fetch).not.toHaveBeenCalled();
		await writable.runtime.close();

		const bad = setup(undefined, true, { rowCount: 'secret-row' });
		const error = await bad.runtime
			.call({ params: { service: 'analytics' }, body: { toolName: 'runRealtimeReport', input: { propertyId: '1', dimensions: ['country'], metrics: ['activeUsers'] } } })
			.catch((e: unknown) => e);
		expect(String((error as Error).message)).not.toContain('secret-row');
		await bad.runtime.close();
	});

	it('rejects service account JSON with a non-Google token_uri before any request', async () => {
		const json = JSON.stringify({ client_email: 'sa@example.test', private_key: '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----', token_uri: 'https://token.example.test/token' });
		const test = setup({ serviceAccountJson: json });
		const error = await test.runtime.call({ params: { service: 'analytics' }, body: { toolName: 'getProperty', input: { propertyId: '1' } } }).catch((e: unknown) => e);
		expect(error).toMatchObject({ code: 'INVALID_CONFIG' });
		expect(String((error as Error).message)).not.toContain('token.example.test');
		expect(test.fetch).not.toHaveBeenCalled();
		await test.runtime.close();
	});
});
