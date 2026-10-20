import { describe, expect, it } from 'vitest';
import { parseCliConfig, resolveCliContext } from './CliConfig';
import { parseCliConfigLayer, serializeCliConfigLayer } from './CliConfigLayer';

describe('native configuration layers', () => {
	it('merges own indexes without flattening inherited services or AI catalogs', () => {
		const base = parseCliConfigLayer(
			{
				services: [
					{ name: 'shared', type: 'http', metadata: { root: true } },
					{ name: 'root', type: 'system' },
				],
				defaults: { services: { http: 'shared', system: 'root' } },
				providers: { global: { api: 'openai', models: { fast: { name: 'fast' } } } },
				prompts: { global: { template: 'root' } },
			},
			{ kind: 'base' },
		);
		const overlay = parseCliConfigLayer(
			{
				services: [{ name: 'shared', api: 'different', enabled: false }],
				defaults: { services: { http: 'own' } },
				metadata: { tags: ['own'] },
				providers: { other: { api: 'gemini' } },
			},
			{ kind: 'context' },
		);
		const resolved = resolveCliContext(parseCliConfig({ ...base, contexts: { local: overlay } }));
		expect(resolved.configuredServices.shared).not.toHaveProperty('metadata');
		expect(Object.keys(resolved.services)).toEqual(['root']);
		expect(resolved.defaults).toEqual({ http: 'own', system: 'root' });
		expect(Object.keys(resolved.providers ?? {})).toEqual(['global', 'other']);
		const document = serializeCliConfigLayer(overlay, 'context');
		expect(document.services).toEqual([{ name: 'shared', api: 'different', enabled: false, readOnly: true }]);
		expect(document.defaults).toEqual({ services: { http: 'own' } });
		expect(document).not.toHaveProperty('prompts');
		expect(document).not.toHaveProperty('version');
		expect(Object.keys(document.providers as object)).toEqual(['other']);
		(document.metadata as { tags: string[] }).tags.push('outside');
		expect(overlay.metadata).toEqual({ tags: ['own'] });
	});
	it.each([
		{ services: {} },
		{ services: [{ name: 'x', provider: 'system' }] },
		{ contexts: {} },
		{ defaults: { system: 'x' } },
		{ services: null },
		{ defaults: null },
		{ removeServices: ['inherited'] },
	])('rejects non-native document shapes', (input) => {
		expect(() => parseCliConfigLayer(input, { kind: 'base' })).toThrow();
	});
	it.each(['version', 'currentContext', 'contexts'])('rejects root control field %s in overlays', (field) => {
		expect(() => parseCliConfigLayer({ [field]: field === 'version' ? 1 : 'local' }, { kind: 'context' })).toThrow();
	});
	it('keeps empty layers empty and does not synthesize services', () => {
		const base = parseCliConfigLayer({}, { kind: 'base' });
		const overlay = parseCliConfigLayer({}, { kind: 'context' });
		expect(base.services).toEqual({});
		expect(base.currentContext).toBe('local');
		expect(serializeCliConfigLayer(overlay, 'context')).toEqual({ services: [], defaults: { services: {} } });
	});
});
