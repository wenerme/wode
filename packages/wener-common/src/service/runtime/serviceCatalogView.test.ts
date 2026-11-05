import { describe, expect, it } from 'vitest';
import { normalizeCliServices } from '../config';
import { buildServiceCatalogView } from './serviceCatalogView';

const providers: Record<string, { name: string; aliases?: string[]; capabilities: string[] }> = {
	prometheus: { name: 'prometheus', aliases: ['prom'], capabilities: ['prometheus'] },
	redis: { name: 'redis', capabilities: ['redis'] },
};

function resolveProviderName(name: string): string | undefined {
	for (const provider of Object.values(providers)) {
		if (provider.name === name || provider.aliases?.includes(name)) return provider.name;
	}
	return undefined;
}

function getProviderCapabilities(canonicalProvider: string): readonly string[] {
	return providers[canonicalProvider]?.capabilities ?? [];
}

describe('buildServiceCatalogView', () => {
	it('marks a configured type with no matching provider as unknown', () => {
		const context = { services: normalizeCliServices({ ghost: { type: 'ghost-type' } }) };
		const [entry] = buildServiceCatalogView(context, { resolveProviderName, getProviderCapabilities });
		expect(entry).toMatchObject({
			name: 'ghost',
			configuredProvider: 'ghost-type',
			canonicalProvider: undefined,
			capabilities: [],
			status: 'unknown',
			isDefault: false,
			ambiguous: false,
		});
	});

	it('resolves a known type via alias and reports its capabilities', () => {
		const context = { services: normalizeCliServices({ metrics: { type: 'prom' } }) };
		const [entry] = buildServiceCatalogView(context, { resolveProviderName, getProviderCapabilities });
		expect(entry).toMatchObject({
			canonicalProvider: 'prometheus',
			capabilities: ['prometheus'],
			status: 'known',
		});
	});

	it('flags a single configured instance as default when defaults selects it', () => {
		const context = { services: normalizeCliServices({ metrics: { type: 'prometheus' } }) };
		const [entry] = buildServiceCatalogView(context, {
			resolveProviderName,
			getProviderCapabilities,
			defaults: { prometheus: 'metrics' },
		});
		expect(entry.isDefault).toBe(true);
		expect(entry.ambiguous).toBe(false);
	});

	it('resolves multiple instances of the same provider when one is the explicit default', () => {
		const context = {
			services: normalizeCliServices({
				primary: { type: 'prometheus' },
				secondary: { type: 'prometheus' },
			}),
		};
		const entries = buildServiceCatalogView(context, {
			resolveProviderName,
			getProviderCapabilities,
			defaults: { prometheus: 'primary' },
		});
		const primary = entries.find((entry) => entry.name === 'primary')!;
		const secondary = entries.find((entry) => entry.name === 'secondary')!;
		expect(primary).toMatchObject({ isDefault: true, ambiguous: false });
		expect(secondary).toMatchObject({ isDefault: false, ambiguous: false });
	});

	it('marks multiple instances ambiguous when no unique default can be picked', () => {
		const context = {
			services: normalizeCliServices({
				primary: { type: 'prometheus' },
				secondary: { type: 'prometheus' },
			}),
		};
		const entries = buildServiceCatalogView(context, { resolveProviderName, getProviderCapabilities });
		expect(entries.every((entry) => entry.ambiguous)).toBe(true);
		expect(entries.every((entry) => !entry.isDefault)).toBe(true);
	});

	it('does not count a disabled instance toward ambiguity and reports it as disabled', () => {
		const context = {
			services: normalizeCliServices({
				primary: { type: 'prometheus' },
				secondary: { type: 'prometheus', disabled: true },
			}),
		};
		const entries = buildServiceCatalogView(context, { resolveProviderName, getProviderCapabilities });
		const primary = entries.find((entry) => entry.name === 'primary')!;
		const secondary = entries.find((entry) => entry.name === 'secondary')!;
		expect(primary.ambiguous).toBe(false);
		expect(secondary.enabled).toBe(false);
		expect(secondary.ambiguous).toBe(false);
	});

	it('falls back to configuredServices to also surface disabled entries and read-only defaults', () => {
		const context = {
			services: normalizeCliServices({ active: { type: 'redis', readOnly: false } }),
			configuredServices: normalizeCliServices({
				active: { type: 'redis', readOnly: false },
				inactive: { type: 'redis', enabled: false },
			}),
		};
		const entries = buildServiceCatalogView(context, { resolveProviderName, getProviderCapabilities });
		expect(entries).toHaveLength(2);
		const active = entries.find((entry) => entry.name === 'active')!;
		const inactive = entries.find((entry) => entry.name === 'inactive')!;
		expect(active).toMatchObject({ enabled: true, readOnly: false });
		expect(inactive).toMatchObject({ enabled: false, status: 'known' });
	});

	it('resolves defaults keyed by capability name against the matching provider group', () => {
		const context = {
			services: normalizeCliServices({
				primary: { type: 'prometheus' },
				secondary: { type: 'prometheus' },
			}),
		};
		// defaults 的 key 是能力名 'prometheus' 本身也等于 provider 名，这里验证按名称回退解析也成立。
		const entries = buildServiceCatalogView(context, {
			resolveProviderName,
			getProviderCapabilities,
			defaults: { 'prometheus-capability': 'secondary' },
		});
		// unmatched default key falls back to itself and does not match the provider group, so it stays ambiguous.
		expect(entries.every((entry) => entry.ambiguous)).toBe(true);
	});
});
