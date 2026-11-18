import { describe, expect, it } from 'vitest';
import { normalizeCliServices, resolveCliServiceConfigEnv } from './ServiceConfig';

describe('service configuration environment references', () => {
	it('resolves exact env references recursively without changing the source', () => {
		const source = normalizeCliServices([{
			name: 'observe',
			type: 'openobserve',
			baseUrl: 'env://OBSERVE_URL',
			headers: { 'x-tenant': 'env://TENANT' },
			options: { accessToken: 'env://OBSERVE_TOKEN', nested: ['env://TENANT'] },
		}]).observe;
		const resolved = resolveCliServiceConfigEnv(source, (name) => ({
			OBSERVE_URL: 'https://observe.example.test',
			TENANT: 'example',
			OBSERVE_TOKEN: 'fixture-token',
		}[name]));
		expect(resolved).toMatchObject({
			baseUrl: 'https://observe.example.test',
			headers: { 'x-tenant': 'example' },
			options: { accessToken: 'fixture-token', nested: ['example'] },
		});
		expect(source.baseUrl).toBe('env://OBSERVE_URL');
		expect(source.options?.accessToken).toBe('env://OBSERVE_TOKEN');
	});

	it('does not resolve embedded references and reports missing variables', () => {
		const source = normalizeCliServices([{ name: 'demo', type: 'system', options: { value: 'prefix-env://TOKEN' } }]).demo;
		expect(resolveCliServiceConfigEnv(source, () => 'fixture')).toMatchObject({ options: { value: 'prefix-env://TOKEN' } });
		expect(() => resolveCliServiceConfigEnv(normalizeCliServices([{ name: 'demo', type: 'system', baseUrl: 'env://MISSING' }]).demo, () => undefined))
			.toThrow('Environment variable MISSING is unavailable');
	});
});
