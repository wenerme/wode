import { describe, expect, it } from 'vitest';
import { CliUsageError } from '../../cli/CliCommand';
import type { CliServiceConfig } from '../config';
import type { ResolvedServiceContext } from './types';
import { selectProviderService } from './selectProviderService';

function context(services: Readonly<Record<string, CliServiceConfig>>): ResolvedServiceContext {
	return { services };
}

const resolveProviderName = (name: string) => (name === 'fixture' || name === 'fx' ? 'fixture' : undefined);

describe('selectProviderService', () => {
	it('prefers the explicit --service selection over any default', () => {
		const services: Record<string, CliServiceConfig> = {
			first: { provider: 'fixture', readOnly: true },
			second: { provider: 'fixture', readOnly: true },
		};
		expect(
			selectProviderService(context(services), {
				provider: 'fixture',
				explicit: 'second',
				resolveProviderName,
				defaults: { fixture: 'first' },
			}),
		).toBe('second');
	});

	it('rejects an explicit selection that does not match the provider or is disabled', () => {
		const services: Record<string, CliServiceConfig> = {
			one: { provider: 'fixture', readOnly: true },
			two: { provider: 'other', readOnly: true },
			disabled: { provider: 'fixture', readOnly: true, disabled: true },
		};
		expect(() =>
			selectProviderService(context(services), { provider: 'fixture', explicit: 'two', resolveProviderName }),
		).toThrow(CliUsageError);
		expect(() =>
			selectProviderService(context(services), { provider: 'fixture', explicit: 'disabled', resolveProviderName }),
		).toThrow(CliUsageError);
	});

	it('uses the configured default for the provider, resolving alias keys in defaults', () => {
		const services: Record<string, CliServiceConfig> = {
			alpha: { provider: 'fixture', readOnly: true },
			beta: { provider: 'fixture', readOnly: true },
		};
		expect(
			selectProviderService(context(services), { provider: 'fixture', resolveProviderName, defaults: { fx: 'beta' } }),
		).toBe('beta');
	});

	it('rejects conflicting defaults pointing at different candidates', () => {
		const services: Record<string, CliServiceConfig> = {
			alpha: { provider: 'fixture', readOnly: true },
			beta: { provider: 'fixture', readOnly: true },
		};
		expect(() =>
			selectProviderService(context(services), {
				provider: 'fixture',
				resolveProviderName,
				defaults: { fixture: 'alpha', fx: 'beta' },
			}),
		).toThrow(CliUsageError);
	});

	it('does not treat a default pointing at a non-candidate service as a conflict', () => {
		const services: Record<string, CliServiceConfig> = {
			alpha: { provider: 'fixture', readOnly: true },
			beta: { provider: 'fixture', readOnly: true },
		};
		expect(
			selectProviderService(context(services), {
				provider: 'fixture',
				resolveProviderName,
				defaults: { fixture: 'alpha', other: 'unrelated' },
			}),
		).toBe('alpha');
	});

	it('prefers a service instance named the same as the provider over the first declared candidate', () => {
		const services: Record<string, CliServiceConfig> = {
			other: { provider: 'fixture', readOnly: true },
			fixture: { provider: 'fixture', readOnly: true },
		};
		expect(selectProviderService(context(services), { provider: 'fixture', resolveProviderName })).toBe('fixture');
	});

	it('falls back to the first declared candidate without raising an ambiguity error', () => {
		const services: Record<string, CliServiceConfig> = {
			first: { provider: 'fixture', readOnly: true },
			second: { provider: 'fixture', readOnly: true },
		};
		expect(selectProviderService(context(services), { provider: 'fixture', resolveProviderName })).toBe('first');
	});

	it('rejects when no enabled service matches the provider', () => {
		const services: Record<string, CliServiceConfig> = {
			one: { provider: 'other', readOnly: true },
			disabled: { provider: 'fixture', readOnly: true, disabled: true },
		};
		expect(() => selectProviderService(context(services), { provider: 'fixture', resolveProviderName })).toThrow(
			CliUsageError,
		);
	});

	it('reads configuredServices over services when both are present', () => {
		const resolved: ResolvedServiceContext = {
			services: { visible: { provider: 'fixture', readOnly: true } },
			configuredServices: { hidden: { provider: 'fixture', readOnly: true, disabled: true }, visible: { provider: 'fixture', readOnly: true } },
		};
		expect(selectProviderService(resolved, { provider: 'fixture', resolveProviderName })).toBe('visible');
	});
});
