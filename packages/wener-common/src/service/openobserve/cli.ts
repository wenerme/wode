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
	description: '查询 OpenObserve 日志、指标和 trace',
	options: [
		{ name: 'organization', aliases: ['org'], description: '覆盖组织名称' },
		{ name: 'stream', description: 'stream 名称' },
		{ name: 'stream-type', aliases: ['type'], description: 'logs | metrics | traces' },
	],
	commands: [
		...OpenObserveExtraCommands,
		{
			group: 'log',
			name: 'query',
			aliases: ['q', 'search'],
			description: '查询日志 stream',
			arguments: '[sql...]',
			options: [
				{ name: 'from', description: '开始时间，默认 now-1h' },
				{ name: 'to', description: '结束时间，默认 now' },
				{ name: 'offset', description: '结果偏移' },
				{ name: 'size', description: '返回数量，1–1000' },
				{ name: 'limit', description: '--size 同义选项' },
				{ name: 'timeout', description: '服务端超时，1–60 秒' },
				{ name: 'where', description: '根据 --stream 生成 WHERE 查询' },
				{ name: 'text', description: '根据 --stream 生成 match_all 查询' },
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
			description: '查询 metrics stream',
			arguments: '[sql...]',
			options: [
				{ name: 'from', description: '开始时间，默认 now-1h' },
				{ name: 'to', description: '结束时间，默认 now' },
				{ name: 'offset', description: '结果偏移' },
				{ name: 'size', description: '返回数量，1–1000' },
				{ name: 'limit', description: '--size 同义选项' },
				{ name: 'timeout', description: '服务端超时，1–60 秒' },
				{ name: 'where', description: '根据 --stream 生成 WHERE 查询' },
				{ name: 'text', description: '根据 --stream 生成 match_all 查询' },
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
			description: '检查健康状态和组织认证',
			prepare({ options }) {
				const input = commonInput(options);
				return async (service, callOptions) => sanitizeOpenObserveOutput(await service.status(input, callOptions));
			},
		},
		{
			group: 'stream',
			name: 'list',
			aliases: ['ls'],
			description: '列出 streams',
			options: [
				{ name: 'offset', description: '结果偏移' },
				{ name: 'limit', description: '返回数量，1–1000' },
				{ name: 'search', description: '名称关键词' },
				{ name: 'fetch-schema', type: 'boolean', description: '同时读取 schema' },
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
			description: '查看 stream schema',
			arguments: '[stream]',
			options: [
				{ name: 'offset', description: '字段偏移' },
				{ name: 'limit', description: '字段数量，1–1000' },
				{ name: 'keyword', description: '字段关键词' },
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
			description: '执行只读 SQL 或生成全文/过滤查询',
			arguments: '[sql...]',
			options: [
				{ name: 'from', description: '开始时间，默认 now-1h' },
				{ name: 'to', description: '结束时间，默认 now' },
				{ name: 'offset', description: '结果偏移' },
				{ name: 'size', description: '返回数量，1–1000' },
				{ name: 'limit', description: '--size 同义选项' },
				{ name: 'timeout', description: '服务端超时，1–60 秒' },
				{ name: 'where', description: '根据 --stream 生成 WHERE 查询' },
				{ name: 'text', description: '根据 --stream 生成 match_all 查询' },
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
			description: '查询 traces stream',
			arguments: '[sql...]',
			options: [
				{ name: 'from', description: '开始时间，默认 now-1h' },
				{ name: 'to', description: '结束时间，默认 now' },
				{ name: 'offset', description: '结果偏移' },
				{ name: 'size', description: '返回数量，1–1000' },
				{ name: 'limit', description: '--size 同义选项' },
				{ name: 'timeout', description: '服务端超时，1–60 秒' },
				{ name: 'where', description: '根据 --stream 生成 WHERE 查询' },
				{ name: 'text', description: '根据 --stream 生成 match_all 查询' },
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
			description: '查看最近 trace 摘要',
			options: [
				{ name: 'from', description: '开始时间，默认 now-1h' },
				{ name: 'to', description: '结束时间，默认 now' },
				{ name: 'offset', description: '结果偏移' },
				{ name: 'size', description: '返回数量，1–1000' },
				{ name: 'limit', description: '--size 同义选项' },
				{ name: 'timeout', description: '服务端超时，1–60 秒' },
				{ name: 'filter', description: 'trace 过滤表达式' },
				{ name: 'sort-by', description: 'start_time | duration' },
				{ name: 'sort-order', description: 'asc | desc' },
			],
			table: (value) => records((value as OpenObserveListTraceResult).traces),
			prepare({ options }) {
				const { streamType, ...common } = queryInput(options);
				if (streamType !== undefined && streamType !== 'traces')
					throw new ServiceCliInputError('Trace 查询要求 --type traces');
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
