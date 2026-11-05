import { type CliOptions, CliUsageError } from '@wener/common/cli';
import { type FetchRequest, FetchRequestSchema, type FetchResponse } from '@wener/common/service/fetch';
import { optionNumber } from '../command-utils';
import {
	booleanOption,
	capabilityDataOutput,
	capabilityOptions,
	capabilityOutputMode,
	capabilityType,
	listCapabilityServices,
	selectCapabilityService,
} from '../commands/service-capability';
import type { WoctlCommand, CliExecution } from '../createCli';

export function validateFetchUrl(value: string): string {
	try {
		const url = new URL(value);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
		return value;
	} catch {
		throw new CliUsageError('Fetch URL must be an HTTP or HTTPS URL without credentials');
	}
}

export function fetchRequest(url: string, options: CliOptions): FetchRequest {
	const request: FetchRequest = {
		url: validateFetchUrl(url),
		text: booleanOption(options, 'text', true),
		summary: booleanOption(options, 'summary'),
		highlights: booleanOption(options, 'highlights'),
		live: booleanOption(options, 'live'),
		main: booleanOption(options, 'main', true),
		maxCharacters: optionNumber(options, 'max-characters', { min: 1, integer: true }),
		metadata: booleanOption(options, 'metadata'),
		raw: booleanOption(options, 'raw'),
	};
	if (!FetchRequestSchema.safeParse(request).success) throw new CliUsageError('Invalid fetch request');
	return request;
}

export function fetchMarkdown(response: FetchResponse, service: string, metadata = false): string {
	if (!metadata) return response.content;
	return [
		response.title ? `# ${response.title}` : undefined,
		`Source: <${response.url}>`,
		`Service: ${service}`,
		'',
		response.content,
	]
		.filter((line) => line !== undefined)
		.join('\n');
}

export function createFetchCommand(): WoctlCommand {
	return {
		name: 'fetch',
		serviceCapability: 'fetch',
		output: 'custom',
		description: 'Fetch URL content through a configured service',
		arguments: '[url]',
		options: [
			...capabilityOptions,
			{ name: 'text', type: 'boolean', negatable: true, description: 'Request extracted text (default)' },
			{ name: 'summary', type: 'boolean', description: 'Request a summary when supported' },
			{ name: 'highlights', type: 'boolean', negatable: true, description: 'Request highlights when supported' },
			{ name: 'live', type: 'boolean', description: 'Request fresh content when supported' },
			{
				name: 'main',
				type: 'boolean',
				negatable: true,
				description: 'Extract main content (default); --no-main keeps the whole page',
			},
			{ name: 'metadata', type: 'boolean', description: 'Prepend title, source and service in Markdown' },
			{ name: 'max-characters', aliases: ['maxcharacters'], description: 'Maximum extracted characters' },
		],
		async run({ args, options }, context) {
			if (options['list-services']) return listCapabilityServices(context, options, 'fetch');
			const mode = capabilityOutputMode(options);
			capabilityType(options, context);
			if (args.length !== 1) throw new CliUsageError('Provide one URL to fetch');
			const request = fetchRequest(args[0], options);
			const service = selectCapabilityService(context, context.getConfigContext(options), 'fetch', options);
			await context.withServices(options, async (runtime) => {
				const response = (await runtime.call(
					{ params: { service }, body: { toolName: 'fetch', input: request } },
					{ signal: context.signal },
				)) as FetchResponse;
				renderFetchResponse(response, service, options, context, mode);
			});
		},
	};
}

function renderFetchResponse(
	response: FetchResponse,
	service: string,
	options: CliOptions,
	context: CliExecution,
	mode = capabilityOutputMode(options),
): void {
	if (mode === 'md' || mode === 'markdown') context.stdout(fetchMarkdown(response, service, options.metadata === true));
	else
		capabilityDataOutput(
			options.raw ? (response.raw ?? response) : { service, ...response, raw: undefined },
			mode,
			context,
		);
}
