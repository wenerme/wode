import { type ServiceCliDefinition, type ServiceCliOptions, serviceCliString, serviceCliStrings } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { ITencentClsService } from '../index';
import { sanitizeClsOutput } from '../sanitize';

/**
 * This slice does not implement relative time syntax (e.g. `now-1h`). Pass an ISO8601
 * timestamp (e.g. `2024-01-01T00:00:00Z`) or a Unix millisecond timestamp.
 */
function parseTime(value: string | undefined, name: string, fallback: () => number): number {
	if (value === undefined) return fallback();
	if (/^\d+$/u.test(value)) {
		const ms = Number(value);
		if (Number.isSafeInteger(ms)) return ms;
	}
	const parsed = Date.parse(value);
	if (Number.isFinite(parsed)) return parsed;
	throw new ServiceCliInputError(`Invalid Tencent CLS --${name}; use ISO8601 or a Unix millisecond timestamp`);
}

function topics(options: ServiceCliOptions): string[] {
	const value = serviceCliStrings(options, 'topic');
	if (!value || value.length === 0) throw new ServiceCliInputError('Tencent CLS --topic is required (repeatable)');
	if (value.some((entry) => !entry.trim())) throw new ServiceCliInputError('Tencent CLS --topic is empty');
	return value;
}

export const TencentClsCliDefinition: ServiceCliDefinition<ITencentClsService> = {
	name: 'cls',
	aliases: ['tencent-cls', 'tencent-log'],
	description: 'Query Tencent Cloud Log Service (CLS) logs and list log topics',
	options: [],
	commands: [
		{
			name: 'query',
			aliases: ['q', 'search'],
			description: 'Search one or more CLS log topics',
			arguments: '<expression>',
			options: [
				{ name: 'topic', description: 'Topic ID or name; repeatable', repeatable: true },
				{ name: 'from', description: 'Start time; ISO8601 or Unix ms timestamp; defaults to 1 hour ago' },
				{ name: 'to', description: 'End time; ISO8601 or Unix ms timestamp; defaults to now' },
				{ name: 'limit', description: 'Maximum number of results, 1-1000; defaults to 100' },
				{ name: 'order', description: 'asc | desc; defaults to desc' },
				{ name: 'context', description: 'Context token to fetch subsequent results' },
				{ name: 'sql', description: 'Treat the expression as including a SQL analysis clause', type: 'boolean' },
			],
			async prepare(context) {
				const expression = context.args.join(' ').trim();
				if (!expression) throw new ServiceCliInputError('Tencent CLS query expression is required');
				const topic = topics(context.options);
				const now = Date.now();
				const from = parseTime(serviceCliString(context.options, 'from'), 'from', () => now - 3_600_000);
				const to = parseTime(serviceCliString(context.options, 'to'), 'to', () => now);
				if (from >= to) throw new ServiceCliInputError('Tencent CLS --from must be before --to');
				const limitRaw = serviceCliString(context.options, 'limit');
				let limit: number | undefined;
				if (limitRaw !== undefined) {
					limit = /^\d+$/u.test(limitRaw) ? Number(limitRaw) : NaN;
					if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000)
						throw new ServiceCliInputError('Invalid Tencent CLS --limit');
				}
				const order = serviceCliString(context.options, 'order');
				if (order !== undefined && order !== 'asc' && order !== 'desc')
					throw new ServiceCliInputError('Tencent CLS --order must be asc or desc');
				const input = {
					topic,
					query: expression,
					from,
					to,
					...(limit !== undefined ? { limit } : {}),
					...(order !== undefined ? { sort: order as 'asc' | 'desc' } : {}),
					...(serviceCliString(context.options, 'context') !== undefined
						? { cursor: serviceCliString(context.options, 'context') }
						: {}),
					...(context.options.sql === true ? { sql: true } : {}),
				};
				return async (service, callOptions) => sanitizeClsOutput(await service.query(input, callOptions));
			},
		},
		{
			name: 'topics',
			aliases: ['ls'],
			description: 'List CLS log topics',
			options: [
				{ name: 'search', description: 'Topic name keyword' },
				{ name: 'limit', description: 'Maximum number of results, 1-1000' },
				{ name: 'offset', description: 'Result offset' },
			],
			async prepare({ options }) {
				const search = serviceCliString(options, 'search');
				const limitRaw = serviceCliString(options, 'limit');
				let limit: number | undefined;
				if (limitRaw !== undefined) {
					limit = /^\d+$/u.test(limitRaw) ? Number(limitRaw) : NaN;
					if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000)
						throw new ServiceCliInputError('Invalid Tencent CLS --limit');
				}
				const offsetRaw = serviceCliString(options, 'offset');
				let offset: number | undefined;
				if (offsetRaw !== undefined) {
					offset = /^\d+$/u.test(offsetRaw) ? Number(offsetRaw) : NaN;
					if (!Number.isSafeInteger(offset) || offset < 0) throw new ServiceCliInputError('Invalid Tencent CLS --offset');
				}
				const input = {
					...(search !== undefined ? { search } : {}),
					...(limit !== undefined ? { limit } : {}),
					...(offset !== undefined ? { offset } : {}),
				};
				return async (service, callOptions) => sanitizeClsOutput(await service.listTopic(input, callOptions));
			},
		},
	],
};
