import { describe, expect, it } from 'vitest';
import { createMemoryCliConfigStore, describeCliContext, parseCliConfig, resolveCliContext } from './CliConfig';

describe('CLI context', () => {
	it('merges root services/defaults and isolates returned snapshots', async () => {
		const store = createMemoryCliConfigStore({
			services: {
				common: {
					provider: 'http',
					baseUrl: 'https://user:secret@example.com/api?token=secret',
					headers: { authorization: 'secret' },
				},
			},
			defaults: { http: 'common' },
			contexts: { local: { services: { own: { provider: 'system' } } }, other: {} },
		});
		const config = await store.load();
		const context = resolveCliContext(config);
		expect(Object.keys(context.services)).toEqual(['common', 'own']);
		expect(context.defaults).toEqual({ http: 'common' });
		expect(JSON.stringify(describeCliContext(context))).not.toContain('secret');
		config.contexts.local.services = {};
		expect(Object.keys(resolveCliContext(await store.load()).services)).toContain('own');
		expect(Object.keys(resolveCliContext(await store.load(), 'other').services)).toEqual(['common']);
	});
	it('rejects missing current contexts and malformed configuration', () => {
		expect(() => resolveCliContext(parseCliConfig({ currentContext: 'missing' }))).toThrow('Unknown context');
		expect(() => parseCliConfig({ version: 2 })).toThrow();
		expect(() => parseCliConfig({ contexts: { 'invalid name': {} } })).toThrow();
		expect(() => resolveCliContext(parseCliConfig({}), 'toString')).toThrow('Unknown context');
	});
});
