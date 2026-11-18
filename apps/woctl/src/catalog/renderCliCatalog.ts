import { type CliOption, CliUsageError } from '@wener/common/cli';
import { formatServiceProviderTypeScript } from './formatServiceProviderTypeScript';
import { CliCatalogJsonSchema } from './schema';
import type { RenderWocliCatalogOptions, CliCatalog, CliCatalogCommand, CliCatalogExample, CliCatalogProvider } from './types';

function select(catalog: CliCatalog, serviceType?: string): CliCatalog {
	if (serviceType === undefined) return catalog;
	const provider = catalog.providers.find((candidate) => candidate.name === serviceType || candidate.aliases?.includes(serviceType));
	if (!provider) throw new CliUsageError('Unknown catalog service type');
	const canonical = (name: string) => catalog.providers.find((candidate) => candidate.name === name || candidate.aliases?.includes(name))?.name ?? name;
	function filter(command: CliCatalogCommand): CliCatalogCommand[] {
		const requirement = command.availability;
		if (requirement?.serviceProvider && canonical(requirement.serviceProvider) !== provider!.name) return [];
		if (requirement?.serviceCapability && !provider!.capabilities?.includes(requirement.serviceCapability)) return [];
		const children = command.commands?.flatMap(filter);
		if (!requirement?.serviceProvider && !requirement?.serviceCapability && !children?.length) return [];
		return [{ ...command, ...(children ? { commands: children } : {}) }];
	}
	return { ...catalog, providers: [provider], commands: catalog.commands.flatMap(filter) };
}

function fence(source: string, language = ''): string {
	const longest = Math.max(2, ...(source.match(/`+/gu) ?? []).map((match) => match.length));
	const marker = '`'.repeat(longest + 1);
	return `${marker}${language}\n${source}\n${marker}`;
}

function cell(value: string): string {
	return value.replace(/\|/gu, '\\|').replace(/[\r\n]/gu, ' ');
}

function inline(value: string): string {
	const marker = '`'.repeat(Math.max(0, ...(value.match(/`+/gu) ?? []).map((match) => match.length)) + 1);
	return `${marker} ${cell(value)} ${marker}`;
}

function optionTable(options: readonly CliOption[]): string {
	return [
		'| Option | Type | Description | Default |',
		'| --- | --- | --- | --- |',
		...options.map((option) => {
			const names = [option.name, ...(option.aliases ?? [])].map((name) => `${name.length === 1 ? '-' : '--'}${name}`);
			const type = [option.type ?? 'string', ...(option.repeatable ? ['repeatable'] : []), ...(option.variadic ? ['variadic'] : []), ...(option.negatable ? ['negatable'] : [])].join(', ');
			return `| ${names.map(inline).join(', ')} | ${type} | ${cell(option.description)} | ${option.default === undefined ? '' : inline(JSON.stringify(option.default))} |`;
		}),
	].join('\n');
}

function exampleMarkdown(example: CliCatalogExample): string {
	return [example.description, fence(example.command, 'sh')].filter(Boolean).join('\n\n');
}

function markdown(catalog: CliCatalog): string {
	const sections = [`# ${cell(catalog.name)} catalog`, `Version: ${cell(catalog.version)}. Catalog schema: ${catalog.schemaVersion}.`];
	if (catalog.globalOptions.length) sections.push('## Global options', optionTable(catalog.globalOptions));
	sections.push('## Commands');
	function tree(commands: readonly CliCatalogCommand[], depth = 0): string[] {
		return commands.flatMap((command) => [`${'  '.repeat(depth)}- ${inline(command.name)} — ${cell(command.description)}`, ...tree(command.commands ?? [], depth + 1)]);
	}
	sections.push(tree(catalog.commands).join('\n'));
	function commands(nodes: readonly CliCatalogCommand[], path: readonly string[] = []) {
		for (const command of nodes) {
			const current = [...path, command.name];
			sections.push(`### ${inline(current.join(' '))}`, command.description);
			if (command.summary?.length) sections.push(command.summary.join('\n'));
			sections.push('Usage:', fence([catalog.name, ...current, command.usage ?? command.arguments].filter(Boolean).join(' '), 'text'));
			if (command.aliases?.length) sections.push(`Aliases: ${command.aliases.map(inline).join(', ')}`);
			if (command.availability) {
				const conditions = [
					...(command.availability.serviceProvider ? [`provider ${inline(command.availability.serviceProvider)}`] : []),
					...(command.availability.serviceCapability ? [`capability ${inline(command.availability.serviceCapability)}`] : []),
				];
				const requirements = [
					...(conditions.length ? [`configured service with ${conditions.join(' and ')}`] : []),
					...(command.availability.hostCapability ? [`host capability ${inline(command.availability.hostCapability)}`] : []),
				];
				sections.push(`Availability: ${requirements.join(' and ')}.`);
			}
			if (command.options?.length) sections.push('Options:', optionTable(command.options));
			if (command.examples?.length) sections.push('Examples:', ...command.examples.map(exampleMarkdown));
			commands(command.commands ?? [], current);
		}
	}
	commands(catalog.commands);
	sections.push('## Service providers');
	for (const provider of catalog.providers) {
		sections.push(`### ${inline(provider.name)}${provider.title ? ` — ${cell(provider.title)}` : ''}`);
		if (provider.description) sections.push(provider.description);
		if (provider.aliases?.length) sections.push(`Aliases: ${provider.aliases.map(inline).join(', ')}`);
		if (provider.capabilities?.length) sections.push(`Capabilities: ${provider.capabilities.map(inline).join(', ')}`);
		if (provider.documentationUrl) sections.push(`Documentation: ${provider.documentationUrl}`);
		if (provider.examples?.length) sections.push('Examples:', ...provider.examples.map(exampleMarkdown));
		if (provider.optionsSchema) sections.push('Provider options schema:', fence(JSON.stringify(provider.optionsSchema, null, 2), 'json'));
		if (provider.contract) {
			sections.push('#### Contract');
			for (const [name, method] of Object.entries(provider.contract.methods)) {
				sections.push(`##### ${inline(name)}`);
				if (method.description) sections.push(method.description);
				for (const key of ['inputType', 'outputType', 'inputSchema', 'outputSchema'] as const) {
					const value = method[key];
					if (value !== undefined) sections.push(`${key}:`, fence(typeof value === 'string' ? value : JSON.stringify(value, null, 2), typeof value === 'string' ? 'typescript' : 'json'));
				}
			}
		}
		if (provider.tools) {
			sections.push('#### Static tools');
			for (const [name, tool] of Object.entries(provider.tools)) {
				sections.push(`##### ${inline(name)}${tool.title ? ` — ${cell(tool.title)}` : ''}`);
				if (tool.description) sections.push(tool.description);
				for (const key of ['inputSchema', 'outputSchema', 'annotations'] as const) {
					if (tool[key] !== undefined) sections.push(`${key}:`, fence(JSON.stringify(tool[key], null, 2), 'json'));
				}
			}
		}
	}
	return `${sections.filter(Boolean).join('\n\n')}\n`;
}

function typescript(providers: readonly CliCatalogProvider[]): string {
	const declarations = providers.map((provider) => ({
		provider,
		source: formatServiceProviderTypeScript(provider),
	}));
	const names = new Map<string, number>();
	for (const { source } of declarations) {
		for (const match of source.matchAll(/^export (?:interface|type) ([A-Za-z_$][A-Za-z0-9_$]*)/gmu)) names.set(match[1], (names.get(match[1]) ?? 0) + 1);
	}
	return declarations.map(({ provider, source }, index) => {
		if (!source) return '';
		const collides = [...source.matchAll(/^export (?:interface|type) ([A-Za-z_$][A-Za-z0-9_$]*)/gmu)].some((match) => names.get(match[1])! > 1);
		if (!collides) return source;
		const label = JSON.stringify(provider.name).replace(/\*\//gu, '* /');
		return `/** Provider ${label}. */\nexport namespace CatalogProvider${index + 1} {\n${source.split('\n').map((line) => `  ${line}`).join('\n')}\n}`;
	}).filter(Boolean).join('\n\n');
}

export function renderCliCatalog(catalog: CliCatalog, options: RenderWocliCatalogOptions): string {
	const selected = select(catalog, options.serviceType);
	switch (options.format) {
		case 'json': return JSON.stringify(selected, null, 2);
		case 'jsonschema': return JSON.stringify(CliCatalogJsonSchema, null, 2);
		case 'md': return markdown(selected);
		case 'typescript': return typescript(selected.providers);
		default: throw new CliUsageError('Supported catalog output formats: json, md, typescript, jsonschema');
	}
}
