import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeCliContext, getEnabledCliService, parseCliConfig, resolveCliContext } from './CliConfig';
import { isCliServiceEnabled, normalizeCliServices } from './ServiceConfig';

afterEach(() => vi.unstubAllGlobals());

describe('service configuration input', () => {
	it('normalizes public arrays while preserving type, api, identity and extensions', () => {
		const services = normalizeCliServices([
			{ name: 'direct', type: 'custom', api: 'different-api', metadata: { region: 'demo' } },
			{ name: 'api-only', api: 'example/v1' },
			{ name: 'matching', type: 'http', provider: 'http', enabled: true, disabled: false },
		]);
		expect(services.direct).toEqual({
			name: 'direct',
			type: 'custom',
			api: 'different-api',
			provider: 'custom',
			readOnly: true,
			metadata: { region: 'demo' },
		});
		expect(services['api-only']).toMatchObject({ name: 'api-only', api: 'example/v1', provider: 'example/v1' });
		expect(services['api-only']).not.toHaveProperty('type');
		expect(services.matching.provider).toBe('http');
	});

	it('keeps legacy custom providers and accepts named map entries without inventing public types', () => {
		const services = normalizeCliServices({
			legacy: { provider: 'custom-provider', options: { profile: 'demo' } },
			declared: { name: 'declared', type: 'http' },
			protocol: { api: 'example/v1' },
		});
		expect(services.legacy).toEqual({ provider: 'custom-provider', options: { profile: 'demo' }, readOnly: true });
		expect(services.declared).toMatchObject({ name: 'declared', type: 'http', provider: 'http' });
		expect(services.protocol.provider).toBe('example/v1');
		expect(normalizeCliServices({})).toEqual({});
		expect(normalizeCliServices([])).toEqual({});
	});

	it.each([
		null,
		'fixture-secret',
		23,
		true,
		[{ type: 'http' }],
		[{ name: 'bad name', type: 'http' }],
		[{ name: '__proto__', type: 'http' }],
		[{ name: 'demo', provider: 'http' }],
		[{ name: 'demo' }],
		[{ name: 'demo', type: '' }],
		[{ name: 'demo', type: '   ', api: 'http' }],
		[{ name: 'demo', type: null, api: 'http' }],
		[{ name: 'demo', type: 'http', provider: 42 }],
		[{ name: 'demo', type: 'http', enabled: 'false' }],
		[{ name: 'demo', type: 'http', disabled: 'true' }],
		[null],
		[['demo', { type: 'http' }]],
		{ demo: null },
		{ demo: [] },
		{ demo: { provider: null } },
	])('rejects malformed service inputs without exposing their values', (services) => {
		let error: unknown;
		try {
			parseCliConfig({ services, credentials: 'fixture-secret' });
		} catch (caught) {
			error = caught;
		}
		expect(error).toBeInstanceOf(Error);
		expect(String(error)).not.toContain('fixture-secret');
	});

	it('reports duplicate identities, map name conflicts and provider conflicts explicitly', () => {
		expect(() =>
			parseCliConfig({
				services: [
					{ name: 'same', type: 'http' },
					{ name: 'same', type: 'system' },
				],
			}),
		).toThrow('Duplicate service name');
		expect(() => parseCliConfig({ services: { named: { name: 'other', provider: 'http' } } })).toThrow(
			'Service name does not match map key',
		);
		for (const services of [
			[{ name: 'demo', type: 'http', provider: 'system' }],
			{ demo: { type: 'http', provider: 'system' } },
			{ demo: { api: 'http', provider: 'system' } },
		]) {
			expect(() => parseCliConfig({ services })).toThrow('Service type and provider conflict');
		}
	});

	it('keeps prototype-looking names as own entries and extension keys as inert data', () => {
		const config = parseCliConfig(
			JSON.parse(
				'{"__proto__":{"polluted":"root"},"services":{"constructor":{"provider":"http","__proto__":{"polluted":"service"}},"toString":{"type":"system"}},"contexts":{"local":{"__proto__":{"polluted":"context"}}}}',
			),
		);
		expect(Object.hasOwn(config, '__proto__')).toBe(true);
		expect(Object.hasOwn(config.contexts.local, '__proto__')).toBe(true);
		expect(Object.hasOwn(config.services.constructor, '__proto__')).toBe(true);
		expect(Object.getPrototypeOf(config.services)).toBe(Object.prototype);
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
		const selected = resolveCliContext(config);
		expect(Object.keys(selected.services)).toEqual(['constructor', 'toString']);
		expect(getEnabledCliService(selected, 'constructor').provider).toBe('http');
		expect(Object.hasOwn(selected.serviceOrigins, 'constructor')).toBe(true);
		expect(() => getEnabledCliService(selected, 'valueOf')).toThrow('Unknown service');
		expect(() => normalizeCliServices({ demo: Object.create({ provider: 'http' }) })).toThrow();
	});

	it('does not access network or credential references while normalizing or resolving', () => {
		const fetch = vi.fn(() => {
			throw new Error('Network access forbidden');
		});
		vi.stubGlobal('fetch', fetch);
		const config = parseCliConfig({
			services: [{ name: 'future', type: 'unknown-adapter', auth: { tokenEnv: 'WOCLI_FIXTURE_NOT_SET' } }],
		});
		expect(resolveCliContext(config).services.future.provider).toBe('unknown-adapter');
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe('effective service availability and sources', () => {
	it.each([
		{ enabled: true, disabled: true },
		{ enabled: false, disabled: false },
	])('rejects contradictory flags', (flags) => {
		expect(() => parseCliConfig({ services: [{ name: 'demo', type: 'http', ...flags }] })).toThrow(
			'Service enabled and disabled flags conflict',
		);
	});

	it('keeps disabled entries for management while preserving whole-entry overrides and flat defaults', () => {
		const config = parseCliConfig({
			currentContext: 'other',
			services: [
				{ name: 'inherited', type: 'http', disabled: true },
				{ name: 'override', type: 'http', headers: { authorization: 'fixture-secret' }, disabled: true },
				{ name: 'off', type: 'http' },
			],
			defaults: { http: 'inherited' },
			contexts: {
				local: {
					services: [
						{ name: 'override', type: 'system' },
						{ name: 'off', type: 'http', enabled: false },
					],
					defaults: { system: 'override' },
				},
				other: {},
			},
		});
		const selected = resolveCliContext(config, 'local');
		expect(Object.keys(selected.services)).toEqual(['override']);
		expect(Object.keys(selected.configuredServices)).toEqual(['inherited', 'override', 'off']);
		expect(selected.services.override).not.toHaveProperty('headers');
		expect(selected.services.override.provider).toBe('system');
		expect(selected.defaults).toEqual({ http: 'inherited', system: 'override' });
		expect(selected.serviceOrigins).toEqual({
			inherited: { scope: 'root' },
			override: { scope: 'context', context: 'local' },
			off: { scope: 'context', context: 'local' },
		});
		expect(Object.keys(resolveCliContext(config).services)).toEqual(['off']);
		expect(config.currentContext).toBe('other');
		expect(() => getEnabledCliService(selected, 'inherited')).toThrow('disabled');
		expect(isCliServiceEnabled(selected.configuredServices.off)).toBe(false);
		const shown = describeCliContext(selected);
		expect(Object.keys(shown.services)).toEqual(['inherited', 'override', 'off']);
		expect(JSON.stringify(shown)).not.toContain('fixture-secret');
	});
});
