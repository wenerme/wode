import { type CliOptions, CliUsageError } from '@wener/common/cli';
import { renderCliCatalog, type CliCatalog, type CliCatalogFormat } from '../catalog';
import type { WoctlCommand } from '../createCli';

function text(options: CliOptions, name: string): string | undefined {
	const value = options[name];
	if (value === undefined) return undefined;
	if (typeof value !== 'string' || !value.trim()) throw new CliUsageError(`--${name} requires one value`);
	return value;
}

export function createCatalogCommand({ catalog }: { catalog: () => CliCatalog }): WoctlCommand {
	return {
		name: 'catalog',
		description: 'Export the complete static command and service provider catalog.\njsonschema describes the catalog document, not the complete native config file schema.',
		output: 'custom',
		options: [
			{ name: 'output', aliases: ['o'], description: 'Output: json, md, typescript, jsonschema', default: 'json' },
			{ name: 'service-type', description: 'Filter by canonical service provider name or alias' },
			{ name: 'output-file', description: 'Write the export to this path instead of stdout' },
			{ name: 'json', type: 'boolean', description: 'Output the complete JSON catalog' },
			{ name: 'format', aliases: ['f'], description: 'Field projection is unsupported for catalog exports' },
		],
		async run({ options }, context) {
			if (options.format !== undefined) throw new CliUsageError('--format projection is unsupported for catalog exports');
			const format = text(options, 'output') ?? 'json';
			if (!['json', 'md', 'typescript', 'jsonschema'].includes(format)) throw new CliUsageError('Supported catalog output formats: json, md, typescript, jsonschema');
			if (options.json === true && format !== 'json') throw new CliUsageError('--json conflicts with --output');
			const serviceType = text(options, 'service-type');
			const filename = text(options, 'output-file');
			if (filename && !context.host.writeText) throw new CliUsageError('This host does not support --output-file');
			context.signal.throwIfAborted();
			const rendered = renderCliCatalog(catalog(), { format: format as CliCatalogFormat, serviceType });
			if (filename) await context.host.writeText!(filename, rendered, { signal: context.signal });
			else context.stdout(rendered);
		},
	};
}
