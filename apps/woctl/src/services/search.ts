import { type CliOptions, CliUsageError } from '@wener/common/cli';
import type { FetchResponse } from '@wener/common/service/fetch';
import {
	type SearchRequest,
	SearchRequestSchema,
	type SearchResponse,
	type SearchResultItem,
} from '@wener/common/service/search';
import { optionNumber, optionString, optionStrings, readCommandText } from '../command-utils';
import {
	booleanOption,
	capabilityDataOutput,
	capabilityOptions,
	capabilityOutputMode,
	capabilityType,
	listCapabilityServices,
	selectCapabilityService,
} from '../commands/service-capability';
import type { WoctlCommand } from '../createCli';
import { fetchRequest } from './fetch';

const positive = { min: 1, integer: true };
const nonnegative = { min: 0, integer: true };
function dateOption(options: CliOptions, key: string): string | undefined {
	const value = optionString(options, key);
	if (value !== undefined && (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/u.test(value) || !Number.isFinite(Date.parse(value))))
		throw new CliUsageError(`Invalid --${key}; expected an ISO date`);
	return value;
}

function buildSearchRequest(query: string, options: CliOptions): SearchRequest {
	const from = dateOption(options, 'from');
	const to = dateOption(options, 'to');
	if (from && to && Date.parse(from) > Date.parse(to)) throw new CliUsageError('--from must be before --to');
	const range = optionString(options, 'time-range');
	if (range && !['d', 'w', 'm', 'y'].includes(range)) throw new CliUsageError('--time-range must be d, w, m or y');
	const content = booleanOption(options, 'content');
	const includeDomains = optionStrings(options, 'include-domain');
	const excludeDomains = optionStrings(options, 'exclude-domain');
	const hasContent = ['content', 'text', 'summary', 'highlights', 'live', 'max-characters'].some(
		(key) => options[key] !== undefined,
	);
	const request: SearchRequest = {
		query,
		raw: booleanOption(options, 'raw'),
		limit: optionNumber(options, 'limit', positive) ?? 10,
		offset: optionNumber(options, 'offset', nonnegative) ?? 0,
		searchType: optionString(options, 'type'),
		category: optionString(options, 'category'),
		includeDomains: includeDomains.length ? includeDomains : undefined,
		excludeDomains: excludeDomains.length ? excludeDomains : undefined,
		range,
		from,
		to,
		content: hasContent
			? {
					text: booleanOption(options, 'text', content),
					summary: booleanOption(options, 'summary'),
					highlights: booleanOption(options, 'highlights', true),
					live: booleanOption(options, 'live'),
					maxCharacters: optionNumber(options, 'max-characters', positive) ?? 260,
				}
			: undefined,
	};
	// Omit unspecified keys for providers with a narrower request contract.
	return Object.fromEntries(
		Object.entries(request).filter(([, value]) => value !== undefined),
	) as unknown as SearchRequest;
}

function escapeMarkdown(value: string): string {
	return value.replace(/([\\`*_{}[\]])/gu, '\\$1');
}
function snippet(item: SearchResultItem): string {
	const highlights = item.highlights ?? item.metadata?.highlights;
	const first = Array.isArray(highlights) ? highlights.find((value) => typeof value === 'string') : undefined;
	return (item.summary || first || item.text || '').replace(/\s+/gu, ' ').trim();
}

export function createSearchCommand(): WoctlCommand {
	return {
		name: 'search',
		serviceCapability: 'search',
		output: 'custom',
		arguments: '[query...]',
		description: 'Search the web through a configured service',
		options: [
			...capabilityOptions,
			{ name: 'limit', aliases: ['n', 'num-results'], description: 'Number of results (default 10)' },
			{ name: 'offset', description: 'Skip the first N results' },
			{ name: 'type', description: 'Search type, e.g. auto, fast, instant, deep' },
			{ name: 'category', description: 'Search category, e.g. news or research paper' },
			{ name: 'include-domain', aliases: ['include'], repeatable: true, description: 'Include a domain; repeatable' },
			{ name: 'exclude-domain', aliases: ['exclude'], repeatable: true, description: 'Exclude a domain; repeatable' },
			{ name: 'time-range', aliases: ['range'], description: 'Time range: d, w, m or y' },
			{ name: 'from', aliases: ['start-published-date'], description: 'Publication start ISO date' },
			{ name: 'to', aliases: ['end-published-date'], description: 'Publication end ISO date' },
			{ name: 'content', type: 'boolean', negatable: true, description: 'Request full page text when supported' },
			{ name: 'text', type: 'boolean', negatable: true, description: 'Request full page text when supported' },
			{ name: 'summary', type: 'boolean', description: 'Request summaries when supported' },
			{ name: 'highlights', type: 'boolean', negatable: true, description: 'Request highlights (default)' },
			{ name: 'live', type: 'boolean', description: 'Request fresh content when supported' },
			{ name: 'max-characters', aliases: ['maxcharacters'], description: 'Maximum text/highlight characters' },
			{ name: 'fetch', type: 'boolean', description: 'Fetch the first displayed search result' },
			{ name: 'fetch-rank', description: 'Fetch one displayed absolute result rank' },
			{ name: 'fetch-limit', description: 'Fetch N displayed results' },
			{ name: 'fetch-offset', description: 'Skip N displayed results before fetching' },
			{ name: 'fetch-service', description: 'Select a configured fetch service instance' },
			{ name: 'fetch-provider', aliases: ['fetch-api'], description: 'Filter fetch services by provider type' },
			{ name: 'fetch-max-characters', description: 'Maximum fetched content characters' },
			{ name: 'fetch-no-main', type: 'boolean', description: 'Keep the whole fetched page' },
		],
		async run({ args, options }, context) {
			if (options['list-services']) return listCapabilityServices(context, options, 'search');
			const mode = capabilityOutputMode(options);
			capabilityType(options, context);
			// Validate all flags before reading stdin or creating any provider client.
			const request = buildSearchRequest('', options);
			const fetchRank = optionNumber(options, 'fetch-rank', positive);
			const fetchLimit = optionNumber(options, 'fetch-limit', positive);
			const fetchOffset = optionNumber(options, 'fetch-offset', nonnegative) ?? 0;
			const fetchMaxCharacters = optionNumber(options, 'fetch-max-characters', positive);
			if (
				fetchRank !== undefined &&
				(fetchLimit !== undefined || options['fetch-offset'] !== undefined || options.fetch)
			)
				throw new CliUsageError('--fetch-rank cannot be combined with --fetch, --fetch-limit or --fetch-offset');
			const fetchEnabled = fetchRank !== undefined || fetchLimit !== undefined || options.fetch === true;
			if (fetchEnabled && mode === 'name')
				throw new CliUsageError('Search fetching does not support name output; use value for fetched content');
			if (
				!fetchEnabled &&
				['fetch-offset', 'fetch-service', 'fetch-provider', 'fetch-max-characters', 'fetch-no-main'].some(
					(key) => options[key] !== undefined,
				)
			)
				throw new CliUsageError('Fetch options require --fetch, --fetch-rank or --fetch-limit');
			if (options.raw && fetchEnabled) throw new CliUsageError('--raw cannot be combined with search fetching');
			const resolved = context.getConfigContext(options);
			const service = selectCapabilityService(context, resolved, 'search', options);
			if (context.resolveServiceProvider?.(resolved.services[service].provider) === 'exa') {
				if ((request.limit ?? 10) + (request.offset ?? 0) > 100)
					throw new CliUsageError('Exa search limit plus offset must be at most 100');
				if (request.range) throw new CliUsageError('Exa search uses --from/--to instead of --time-range');
				request.searchType ??= 'auto';
				request.content ??= { highlights: true, maxCharacters: 260 };
			}
			const fetchOptions: CliOptions = {
				service: optionString(options, 'fetch-service'),
				provider: optionString(options, 'fetch-provider'),
				'max-characters': (fetchMaxCharacters ?? optionNumber(options, 'max-characters', positive))?.toString(),
				main: options['fetch-no-main'] !== true,
			};
			const fetchService = fetchEnabled ? selectCapabilityService(context, resolved, 'fetch', fetchOptions) : undefined;
			const query =
				args.join(' ').trim() ||
				(!context.host.term?.stdinIsTTY && context.host.readText ? (await readCommandText('-', context)).trim() : '');
			if (!query) throw new CliUsageError('Missing search query');
			request.query = query;
			if (!SearchRequestSchema.safeParse(request).success) throw new CliUsageError('Invalid search request');
			await context.withServices(options, async (runtime) => {
				const response = (await runtime.call(
					{ params: { service }, body: { toolName: 'search', input: request } },
					{ signal: context.signal },
				)) as SearchResponse;
				const rows = response.items.map((item, index) => ({
					...item,
					rank: (request.offset ?? 0) + index + 1,
					title: item.title ?? '',
					url: item.url,
					publishedDate: item.publishedAt ?? '',
					author: typeof item.metadata?.author === 'string' ? item.metadata.author : '',
					highlight: snippet(item),
					summary: item.summary ?? '',
				}));
				const targets =
					fetchRank !== undefined
						? rows.filter((row) => row.rank === fetchRank)
						: fetchService
							? rows.slice(fetchOffset, fetchOffset + (fetchLimit ?? 1))
							: [];
				if (fetchRank !== undefined && !targets.length)
					throw new CliUsageError('--fetch-rank is outside the displayed results');
				// Prepare every fetch URL before invoking the first fetch operation.
				const requests = targets.map((row) => fetchRequest(row.url, fetchOptions));
				const fetched: Array<FetchResponse & { rank: number; service: string; raw: undefined }> = [];
				for (const [index, input] of requests.entries()) {
					context.signal.throwIfAborted();
					const result = (await runtime.call(
						{ params: { service: fetchService! }, body: { toolName: 'fetch', input } },
						{ signal: context.signal },
					)) as FetchResponse;
					fetched.push({ rank: targets[index].rank, service: fetchService!, ...result, raw: undefined });
				}
				if (mode === 'md' || mode === 'markdown') {
					const markdown = fetched.length
						? [
								`# Search: ${escapeMarkdown(query)}`,
								...fetched.map((result, index) =>
									[
										`## ${result.rank}. ${escapeMarkdown(targets[index].title || result.title || '(untitled)')}`,
										`Source: <${result.url}>`,
										`Fetch service: ${fetchService}`,
										targets[index].highlight
											? `Search snippet: ${escapeMarkdown(targets[index].highlight)}`
											: undefined,
										'',
										result.content || '(no content)',
									]
										.filter((line) => line !== undefined)
										.join('\n'),
								),
							].join('\n\n')
						: rows
								.map(
									(row) =>
										`${row.rank}. **${escapeMarkdown(row.title || '(untitled)')}**\n   <${row.url}>${row.highlight ? `\n   ${escapeMarkdown(row.highlight)}` : ''}`,
								)
								.join('\n\n') || '_No search results._';
					context.stdout(markdown);
				} else if (options.raw) capabilityDataOutput(response.raw ?? response, mode, context);
				else {
					const result = ['json', 'yaml', 'yml', 'jsonl'].includes(mode)
						? {
								service,
								provider:
									context.resolveServiceProvider?.(resolved.services[service].provider) ??
									resolved.services[service].provider,
								query,
								limit: request.limit,
								offset: request.offset,
								results: rows,
								nextCursor: response.nextCursor,
								metadata: response.metadata,
								...(fetchService ? { fetched } : {}),
							}
						: fetched.length
							? mode === 'value'
								? fetched.map((row) => row.content)
								: fetched.map((row, index) => ({
										rank: row.rank,
										title: row.title ?? targets[index].title,
										url: row.url,
										content: row.content,
										service: row.service,
									}))
							: rows.map((row) => ({
									rank: row.rank,
									title: row.title,
									url: row.url,
									...(mode === 'wide'
										? { publishedDate: row.publishedDate, author: row.author, summary: row.summary }
										: {}),
									highlight: row.highlight,
								}));
					capabilityDataOutput(result, mode, context);
				}
			});
		},
	};
}
