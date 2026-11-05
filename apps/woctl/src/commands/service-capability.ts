import { type CliOption, type CliOptions, CliUsageError, renderCliOutput } from '@wener/common/cli';
import type { CliOutputMode } from '@wener/common/cli/format/types';
import type { ResolvedCliContext } from 'common/context';
import { optionString, writeCommandOutput } from '../command-utils';
import type { CliExecution } from '../createCli';

export const capabilityOptions: readonly CliOption[] = [
	{ name: 'service', description: 'Select a configured service instance' },
	{ name: 'provider', description: 'Filter configured services by provider type' },
	{ name: 'api', description: 'Filter configured services by provider type (alias of --provider)' },
	{ name: 'list-services', type: 'boolean', description: 'List enabled services supporting this capability' },
	{ name: 'output', aliases: ['o'], description: 'Output: md, json, yaml, table, wide, csv, name, value' },
	{ name: 'json', type: 'boolean', description: 'Output JSON' },
	{ name: 'raw', type: 'boolean', description: 'Emit the raw provider response in JSON or YAML' },
];

export function capabilityCandidates(
	context: CliExecution,
	resolved: ResolvedCliContext,
	capability: string,
	type?: string,
) {
	const canonical = (name: string) => context.resolveServiceProvider?.(name) ?? name;
	return Object.entries(resolved.services)
		.filter(([, config]) => (context.getServiceCapabilities?.(config.provider) ?? []).includes(capability))
		.filter(([, config]) => !type || canonical(config.provider) === canonical(type))
		.map(([name, config]) => ({ name, provider: canonical(config.provider), readOnly: config.readOnly !== false }));
}

export function capabilityType(options: CliOptions, context: CliExecution): string | undefined {
	const provider = optionString(options, 'provider');
	const api = optionString(options, 'api');
	const canonical = (name: string) => context.resolveServiceProvider?.(name) ?? name;
	if (provider && api && canonical(provider) !== canonical(api))
		throw new CliUsageError('Conflicting --provider and --api');
	return provider ?? api;
}

export function selectCapabilityService(
	context: CliExecution,
	resolved: ResolvedCliContext,
	capability: string,
	options: CliOptions,
): string {
	const candidates = capabilityCandidates(context, resolved, capability, capabilityType(options, context));
	const explicit = optionString(options, 'service');
	if (explicit) {
		if (!candidates.some((item) => item.name === explicit))
			throw new CliUsageError(`Selected service does not support ${capability} or is disabled`);
		return explicit;
	}
	const configuredDefault = Object.hasOwn(resolved.defaults, capability) ? resolved.defaults[capability] : undefined;
	if (configuredDefault) {
		if (!candidates.some((item) => item.name === configuredDefault))
			throw new CliUsageError(`Default ${capability} service is unavailable or does not match the provider filter`);
		return configuredDefault;
	}
	// Provider defaults remain useful for existing single-provider contexts.
	const canonical = (name: string) => context.resolveServiceProvider?.(name) ?? name;
	const providerDefaults = [
		...new Set(
			Object.entries(resolved.defaults)
				.filter(([key, value]) => candidates.some((item) => item.provider === canonical(key) && item.name === value))
				.map(([, value]) => value),
		),
	];
	if (providerDefaults.length === 1) return providerDefaults[0];
	if (providerDefaults.length > 1)
		throw new CliUsageError(`Conflicting default ${capability} services; select one with --service`);
	if (candidates.length === 1) return candidates[0].name;
	throw new CliUsageError(
		`Select one ${capability} service with --service; available: ${candidates.map((item) => `${item.name} (${item.provider})`).join(', ') || '(none)'}`,
	);
}

export function listCapabilityServices(context: CliExecution, options: CliOptions, capability: string): void {
	const resolved = context.getConfigContext(options);
	const candidates = capabilityCandidates(context, resolved, capability, capabilityType(options, context));
	let selected: string | undefined;
	try {
		selected = selectCapabilityService(context, resolved, capability, options);
	} catch {
		/* Listing also works for ambiguous contexts. */
	}
	writeCommandOutput(
		candidates.map((item) => ({ ...item, default: item.name === selected })),
		options,
		context,
	);
}

export function capabilityOutputMode(options: CliOptions): CliOutputMode {
	const mode = options.json ? 'json' : (optionString(options, 'output') ?? 'md');
	if (!['md', 'markdown', 'json', 'yaml', 'yml', 'table', 'wide', 'csv', 'name', 'value', 'jsonl'].includes(mode))
		throw new CliUsageError('Output must be md, json, yaml, table, wide, csv, name, value or jsonl');
	if (options.raw && !['json', 'yaml', 'yml'].includes(mode))
		throw new CliUsageError('--raw requires JSON or YAML output');
	return mode as CliOutputMode;
}

export function capabilityDataOutput(value: unknown, mode: CliOutputMode, context: CliExecution): void {
	context.signal.throwIfAborted();
	context.stdout(renderCliOutput(value, { format: mode, columns: context.columns }));
}

export function booleanOption(options: CliOptions, key: string, fallback?: boolean): boolean | undefined {
	const value = options[key];
	if (value !== undefined && typeof value !== 'boolean') throw new CliUsageError(`--${key} requires a boolean`);
	return value ?? fallback;
}
