import type { CliTable } from '../../cli/render/CliTable';
import { type ServiceCliDefinition, serviceCliString } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import type {
	IOpenObserveService,
	OpenObserveListStreamResult,
	OpenObserveListTraceResult,
	OpenObserveSearchResult,
	OpenObserveStreamSchemaResult,
} from './index';
import { commonInput, integerOption, prepareQuery, queryInput, requiredStream } from './input';
import { sanitizeOpenObserveOutput } from './sanitize';
import { OpenObserveExtraCommands } from './commands';

function records(value: unknown[]): CliTable {
	const rows = value.map((item) =>
		item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : { value: item },
	);
	const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
	return { headers, rows: rows.map((row) => headers.map((header) => row[header])) };
}
export const OpenObserveCliDefinition: ServiceCliDefinition<IOpenObserveService> = {
	name: 'openobserve',
	aliases: ['oo'],
	description: 'Query OpenObserve logs, metrics and traces',
	options: [
		{ name: 'organization', aliases: ['org'], description: 'Override the organization name' },
		{ name: 'stream', description: 'Stream name' },
		{ name: 'stream-type', aliases: ['type'], description: 'logs | metrics | traces' },
	],
	commands: [
		...OpenObserveExtraCommands,
		{
			group: 'log',
			name: 'query',
			aliases: ['q', 'search'],
			description: 'Query a log stream',
			arguments: '[sql...]',
			options: [
				{ name: 'from', description: 'Start time; defaults to now-1h' },
				{ name: 'to', description: 'End time; defaults to now' },
				{ name: 'offset', description: 'Result offset' },
				{ name: 'size', description: 'Number of results, 1–1000' },
				{ name: 'limit', description: 'Alias for --size' },
				{ name: 'timeout', description: 'Server timeout, 1–60 seconds' },
				{ name: 'where', description: 'Generate a WHERE query using --stream' },
				{ name: 'text', description: 'Generate a match_all query using --stream' },
			],
			table: (value) => records((value as OpenObserveSearchResult).hits),
			async prepare(context) {
				const input = { ...queryInput(context.options), streamType: 'logs' as const };
				const sql = await prepareQuery(context);
				return async (service, callOptions) => sanitizeOpenObserveOutput(await service.search({ ...input, sql }, callOptions));
			},
		},
		{
			group: 'metric',
			name: 'query',
			aliases: ['q', 'sql'],
			description: 'Query a metrics stream',
			arguments: '[sql...]',
			options: [
				{ name: 'from', description: 'Start time; defaults to now-1h' },
				{ name: 'to', description: 'End time; defaults to now' },
				{ name: 'offset', description: 'Result offset' },
				{ name: 'size', description: 'Number of results, 1–1000' },
				{ name: 'limit', description: 'Alias for --size' },
				{ name: 'timeout', description: 'Server timeout, 1–60 seconds' },
				{ name: 'where', description: 'Generate a WHERE query using --stream' },
				{ name: 'text', description: 'Generate a match_all query using --stream' },
			],
			table: (value) => records((value as OpenObserveSearchResult).hits),
			async prepare(context) {
				const input = { ...queryInput(context.options), streamType: 'metrics' as const };
				const sql = await prepareQuery(context);
				return async (service, callOptions) => sanitizeOpenObserveOutput(await service.search({ ...input, sql }, callOptions));
			},
		},
		{
			name: 'status',
			description: 'Check service health and organization authentication',
			prepare({ options }) {
				const input = commonInput(options);
				return async (service, callOptions) => sanitizeOpenObserveOutput(await service.status(input, callOptions));
			},
		},
		{
			group: 'stream',
			name: 'list',
			aliases: ['ls'],
			description: 'List streams',
			options: [
				{ name: 'offset', description: 'Result offset' },
				{ name: 'limit', description: 'Number of results, 1–1000' },
				{ name: 'search', description: 'Name keyword' },
				{ name: 'fetch-schema', type: 'boolean', description: 'Also fetch schemas' },
			],
			table: (value) => records((value as OpenObserveListStreamResult).streams),
			prepare({ options }) {
				const input = {
					...commonInput(options),
					offset: integerOption(options, 'offset', 0, 2_147_483_647),
					limit: integerOption(options, 'limit', 1, 1000),
					keyword: serviceCliString(options, 'search'),
					fetchSchema: options['fetch-schema'] === true,
				};
				return async (service, callOptions) => sanitizeOpenObserveOutput(await service.listStreams(input, callOptions));
			},
		},
		{
			group: 'stream',
			name: 'schema',
			description: 'Show a stream schema',
			arguments: '[stream]',
			options: [
				{ name: 'offset', description: 'Field offset' },
				{ name: 'limit', description: 'Number of fields, 1–1000' },
				{ name: 'keyword', description: 'Field keyword' },
			],
			table: (value) => records((value as OpenObserveStreamSchemaResult).fields),
			prepare({ args, options }) {
				const input = {
					...commonInput(options),
					stream: requiredStream(options, args[0]),
					offset: integerOption(options, 'offset', 0, 2_147_483_647),
					limit: integerOption(options, 'limit', 1, 1000),
					keyword: serviceCliString(options, 'keyword'),
				};
				return async (service, callOptions) =>
					sanitizeOpenObserveOutput(await service.getStreamSchema(input, callOptions));
			},
		},
		{
			name: 'query',
			aliases: ['q', 'search'],
			description: 'Run read-only SQL or generate a full-text or filter query',
			arguments: '[sql...]',
			options: [
				{ name: 'from', description: 'Start time; defaults to now-1h' },
				{ name: 'to', description: 'End time; defaults to now' },
				{ name: 'offset', description: 'Result offset' },
				{ name: 'size', description: 'Number of results, 1–1000' },
				{ name: 'limit', description: 'Alias for --size' },
				{ name: 'timeout', description: 'Server timeout, 1–60 seconds' },
				{ name: 'where', description: 'Generate a WHERE query using --stream' },
				{ name: 'text', description: 'Generate a match_all query using --stream' },
			],
			table: (value) => records((value as OpenObserveSearchResult).hits),
			async prepare(context) {
				const input = queryInput(context.options);
				const sql = await prepareQuery(context);
				return async (service, callOptions) =>
					sanitizeOpenObserveOutput(await service.search({ ...input, sql }, callOptions));
			},
		},
		{
			group: 'trace',
			name: 'query',
			aliases: ['q', 'sql'],
			description: 'Query a traces stream',
			arguments: '[sql...]',
			options: [
				{ name: 'from', description: 'Start time; defaults to now-1h' },
				{ name: 'to', description: 'End time; defaults to now' },
				{ name: 'offset', description: 'Result offset' },
				{ name: 'size', description: 'Number of results, 1–1000' },
				{ name: 'limit', description: 'Alias for --size' },
				{ name: 'timeout', description: 'Server timeout, 1–60 seconds' },
				{ name: 'where', description: 'Generate a WHERE query using --stream' },
				{ name: 'text', description: 'Generate a match_all query using --stream' },
			],
			table: (value) => records((value as OpenObserveSearchResult).hits),
			async prepare(context) {
				const input = { ...queryInput(context.options), streamType: 'traces' as const };
				const sql = await prepareQuery(context);
				return async (service, callOptions) => sanitizeOpenObserveOutput(await service.search({ ...input, sql }, callOptions));
			},
		},
		{
			group: 'trace',
			name: 'list',
			aliases: ['ls'],
			description: 'Show recent trace summaries',
			options: [
				{ name: 'from', description: 'Start time; defaults to now-1h' },
				{ name: 'to', description: 'End time; defaults to now' },
				{ name: 'offset', description: 'Result offset' },
				{ name: 'size', description: 'Number of results, 1–1000' },
				{ name: 'limit', description: 'Alias for --size' },
				{ name: 'timeout', description: 'Server timeout, 1–60 seconds' },
				{ name: 'filter', description: 'Trace filter expression' },
				{ name: 'sort-by', description: 'start_time | duration' },
				{ name: 'sort-order', description: 'asc | desc' },
			],
			table: (value) => records((value as OpenObserveListTraceResult).traces),
			prepare({ options }) {
				const { streamType, ...common } = queryInput(options);
				if (streamType !== undefined && streamType !== 'traces')
					throw new ServiceCliInputError('Trace queries require --type traces');
				const sortBy = serviceCliString(options, 'sort-by');
				const sortOrder = serviceCliString(options, 'sort-order');
				if (sortBy !== undefined && !['start_time', 'duration'].includes(sortBy))
					throw new ServiceCliInputError('Invalid OpenObserve --sort-by');
				if (sortOrder !== undefined && !['asc', 'desc'].includes(sortOrder))
					throw new ServiceCliInputError('Invalid OpenObserve --sort-order');
				const input = {
					...common,
					stream: requiredStream(options),
					filter: serviceCliString(options, 'filter'),
					sortBy: sortBy as 'start_time' | 'duration' | undefined,
					sortOrder: sortOrder as 'asc' | 'desc' | undefined,
				};
				return async (service, callOptions) => sanitizeOpenObserveOutput(await service.listTraces(input, callOptions));
			},
		},
	],
};
