import type { CliTable } from '../../../cli/render/CliTable';
import { type ServiceCliDefinition, type ServiceCliInputContext, type ServiceCliOptions, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IPrometheusService } from '../index';
import { labelsInput, labelValuesInput, metadataInput, queryInput, queryRangeInput, seriesInput } from '../input';
import { sanitizePrometheusOutput } from '../sanitize';

function table(value: unknown): CliTable {
	if (!Array.isArray(value)) return { headers: ['value'], rows: [[value]] };
	return { headers: ['value'], rows: value.map((entry) => [entry]) };
}
const rangeOptions = [
	{ name: 'start', description: 'Start time or Unix timestamp' },
	{ name: 'end', description: 'End time or Unix timestamp' },
	{ name: 'match', description: 'Series matcher; repeatable', repeatable: true },
];
const queryOption = { name: 'query', description: 'PromQL expression, @file or - for stdin' };

async function prepareQuery<T extends { query: string }>(
	context: ServiceCliInputContext,
	parse: (options: ServiceCliOptions, query: string) => T,
): Promise<T> {
	const source = serviceCliString(context.options, 'query');
	if (source !== undefined && context.args.length > 0)
		throw new ServiceCliInputError('Prometheus positional query conflicts with --query');
	// Validate all options before asking the host to read a file or stdin.
	const input = parse(context.options, source ?? context.args.join(' '));
	if (source !== undefined && (input.query.startsWith('@') || input.query === '-')) {
		input.query = (await context.readText(input.query, { label: 'Prometheus query', maxBytes: 16 * 1024 * 1024 })).trim();
		if (!input.query) throw new ServiceCliInputError('Prometheus query is required');
	}
	return input;
}

export const PrometheusCliDefinition: ServiceCliDefinition<IPrometheusService> = {
	name: 'prometheus',
	aliases: ['prom'],
	description: 'Query Prometheus/VictoriaMetrics metrics',
	options: [],
	commands: [
		{
			name: 'query', aliases: ['q'], description: 'Run an instant PromQL query', arguments: '[query...]',
			options: [queryOption, { name: 'time', description: 'Evaluation time' }, { name: 'timeout', description: 'Server query timeout' }],
			async prepare(context) {
				const input = await prepareQuery(context, queryInput);
				return async (service, callOptions) => sanitizePrometheusOutput(await service.query(input, callOptions));
			},
		},
		{
			name: 'query-range', aliases: ['range'], description: 'Run a PromQL range query', arguments: '[query...]',
			options: [queryOption, { name: 'start', description: 'Start time; defaults to now-1h' }, { name: 'end', description: 'End time; defaults to now' }, { name: 'step', description: 'Step size; defaults to 60' }, { name: 'timeout', description: 'Server query timeout' }],
			async prepare(context) {
				const input = await prepareQuery(context, queryRangeInput);
				return async (service, callOptions) => sanitizePrometheusOutput(await service.queryRange(input, callOptions));
			},
		},
		{ name: 'series', description: 'List matching time series', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ options }) { const input = seriesInput(options); return async (service, callOptions) => sanitizePrometheusOutput(await service.series(input, callOptions)); } },
		{ name: 'labels', description: 'List label names', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ options }) { const input = labelsInput(options); return async (service, callOptions) => sanitizePrometheusOutput(await service.labels(input, callOptions)); } },
		{ name: 'label-values', aliases: ['values'], description: 'List values for a label', arguments: '<label>', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ args, options }) { const input = labelValuesInput(options, args[0] ?? ''); return async (service, callOptions) => sanitizePrometheusOutput(await service.labelValues(input, callOptions)); } },
		{ name: 'metadata', description: 'List metric metadata', options: [{ name: 'limit', description: 'Maximum number of results' }, { name: 'metric', description: 'Metric name' }], prepare({ options }) { const input = metadataInput(options); return async (service, callOptions) => sanitizePrometheusOutput(await service.metadata(input, callOptions)); } },
	],
};
