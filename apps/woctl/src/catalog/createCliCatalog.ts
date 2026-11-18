import type { CliCommandDefinition, CliOption } from '@wener/common/cli';
import type { ServiceContract, ServiceProvider, ServiceTool } from '@wener/common/service';
import { getServiceOptionsJsonSchema } from '@wener/common/service/runtime';
import type { WoctlCommand } from '../createCli';
import {
	WOCLI_CATALOG_SCHEMA_VERSION,
	type CliCatalog,
	type CliCatalogAvailability,
	type CliCatalogCommand,
	type CliCatalogExample,
	type CliCatalogProvider,
} from './types';

export interface CreateCliCatalogInput {
	name: string;
	version: string;
	globalOptions: readonly CliOption[];
	/** The complete raw Cli.describe() tree, before context filtering. */
	commands: readonly CliCommandDefinition[];
	providers: readonly ServiceProvider[];
	registrations?: readonly { command: WoctlCommand }[];
}

/** Deliberately pick fields before cloning: never traverse a host, handler, parser or instance. */
function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
	return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]])) as Pick<T, K>;
}

function optionSnapshot(option: CliOption): CliOption {
	return structuredClone(pick(option, [
		'name', 'aliases', 'description', 'helpScope', 'type', 'repeatable', 'variadic', 'default', 'negatable',
	]));
}

function contractSnapshot(contract: ServiceContract): ServiceContract {
	return { methods: Object.fromEntries(Object.entries(contract.methods).map(([name, method]) => [
		name, structuredClone(pick(method, ['description', 'inputSchema', 'outputSchema', 'inputType', 'outputType'])),
	])) };
}

/** Structural metadata extension keeps this module compatible while providers gain static tools. */
type StaticProvider = ServiceProvider & Pick<CliCatalogProvider, 'title' | 'description' | 'documentationUrl' | 'examples' | 'tools'>;

export function describeServiceProvider(raw: ServiceProvider): CliCatalogProvider {
	const provider = raw as StaticProvider;
	const optionsSchema = getServiceOptionsJsonSchema(provider.optionsSchema);
	return {
		...structuredClone(pick(provider, ['name', 'aliases', 'capabilities', 'title', 'description', 'documentationUrl', 'examples'])),
		...(optionsSchema ? { optionsSchema: structuredClone(optionsSchema) } : {}),
		...(provider.contract ? { contract: contractSnapshot(provider.contract) } : {}),
		...(provider.tools ? { tools: Object.fromEntries(Object.entries(provider.tools).map(([name, tool]) => [
			name, structuredClone(pick<ServiceTool, keyof ServiceTool>(tool, ['title', 'description', 'inputSchema', 'outputSchema', 'annotations'])),
		])) } : {}),
	};
}

export function createCliCatalog(input: CreateCliCatalogInput): CliCatalog {
	const metadata = new Map<string, CliCatalogAvailability & { examples?: readonly CliCatalogExample[] }>();
	function register(command: WoctlCommand, siblings: readonly CliCommandDefinition[], parent: readonly string[]) {
		const canonical = siblings.find((candidate) => candidate.name === command.name || candidate.aliases?.includes(command.name));
		if (!canonical) return;
		const path = [...parent, canonical.name];
		const key = JSON.stringify(path);
		const previous = metadata.get(key) ?? {};
		const fragment = command as WoctlCommand & { examples?: readonly CliCatalogExample[] };
		metadata.set(key, { ...previous, ...pick(fragment, ['serviceProvider', 'serviceCapability', 'hostCapability', 'examples']) });
		for (const child of command.commands ?? []) register(child, canonical.commands ?? [], path);
	}
	for (const { command } of input.registrations ?? []) register(command, input.commands, []);
	function snapshot(command: CliCommandDefinition, parent: readonly string[], inherited: CliCatalogAvailability): CliCatalogCommand {
		const path = [...parent, command.name];
		const extra = metadata.get(JSON.stringify(path));
		const availability = { ...inherited, ...(extra ? pick(extra, ['serviceProvider', 'serviceCapability', 'hostCapability']) : {}) };
		const examples = command.examples ?? extra?.examples;
		return {
			...structuredClone(pick(command, ['name', 'output', 'hidden', 'raw', 'aliases', 'description', 'summary', 'arguments', 'usage'])),
			...(command.options ? { options: command.options.map(optionSnapshot) } : {}),
			...(Object.keys(availability).length ? { availability } : {}),
			...(examples ? { examples: structuredClone(examples) } : {}),
			...(command.commands ? { commands: command.commands.map((child) => snapshot(child, path, availability)) } : {}),
		};
	}
	return {
		schemaVersion: WOCLI_CATALOG_SCHEMA_VERSION,
		name: input.name,
		version: input.version,
		globalOptions: input.globalOptions.map(optionSnapshot),
		commands: input.commands.map((command) => snapshot(command, [], {})),
		providers: input.providers.map(describeServiceProvider),
	};
}
