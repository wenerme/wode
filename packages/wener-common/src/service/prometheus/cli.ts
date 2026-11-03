import type { CliTable } from '../../cli/render/CliTable';
import type { ServiceCliDefinition } from '../cli/ServiceCliDefinition';
import type { IPrometheusService } from './index';
import { labelsInput, labelValuesInput, metadataInput, queryInput, queryRangeInput, seriesInput } from './input';
import { sanitizePrometheusOutput } from './sanitize';

function table(value: unknown): CliTable {
	if (!Array.isArray(value)) return { headers: ['value'], rows: [[value]] };
	return { headers: ['value'], rows: value.map((entry) => [entry]) };
}
const rangeOptions = [
	{ name: 'start', description: 'Start time or Unix timestamp' },
	{ name: 'end', description: 'End time or Unix timestamp' },
	{ name: 'match', description: 'Series matcher; repeatable' },
];

export const PrometheusCliDefinition: ServiceCliDefinition<IPrometheusService> = {
	name: 'prometheus',
	aliases: ['prom'],
	description: 'Query Prometheus/VictoriaMetrics metrics',
	options: [],
	commands: [
		{ name: 'query', aliases: ['q'], description: 'Run an instant PromQL query', arguments: '[query...]', options: [{ name: 'time', description: 'Evaluation time' }, { name: 'timeout', description: 'Server query timeout' }], prepare({ args, options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.query(queryInput(options, args.join(' ')), callOptions)); } },
		{ name: 'query-range', aliases: ['range'], description: 'Run a PromQL range query', arguments: '[query...]', options: [{ name: 'start', description: 'Start time; defaults to now-1h' }, { name: 'end', description: 'End time; defaults to now' }, { name: 'step', description: 'Step size; defaults to 60' }, { name: 'timeout', description: 'Server query timeout' }], prepare({ args, options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.queryRange(queryRangeInput(options, args.join(' ')), callOptions)); } },
		{ name: 'series', description: 'List matching time series', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.series(seriesInput(options), callOptions)); } },
		{ name: 'labels', description: 'List label names', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.labels(labelsInput(options), callOptions)); } },
		{ name: 'label-values', aliases: ['values'], description: 'List values for a label', arguments: '<label>', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ args, options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.labelValues(labelValuesInput(options, args[0] ?? ''), callOptions)); } },
		{ name: 'metadata', description: 'List metric metadata', options: [{ name: 'limit', description: 'Maximum number of results' }, { name: 'metric', description: 'Metric name' }], prepare({ options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.metadata(metadataInput(options), callOptions)); } },
	],
};
