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
	{ name: 'start', description: '开始时间或 Unix 时间戳' },
	{ name: 'end', description: '结束时间或 Unix 时间戳' },
	{ name: 'match', description: 'series matcher，可重复' },
];

export const PrometheusCliDefinition: ServiceCliDefinition<IPrometheusService> = {
	name: 'prometheus',
	aliases: ['prom'],
	description: '查询 Prometheus/VictoriaMetrics 指标',
	options: [],
	commands: [
		{ name: 'query', aliases: ['q'], description: '执行即时 PromQL 查询', arguments: '[query...]', options: [{ name: 'time', description: '评估时间' }, { name: 'timeout', description: '服务端查询超时' }], prepare({ args, options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.query(queryInput(options, args.join(' ')), callOptions)); } },
		{ name: 'query-range', aliases: ['range'], description: '执行 PromQL 区间查询', arguments: '[query...]', options: [{ name: 'start', description: '开始时间，默认 now-1h' }, { name: 'end', description: '结束时间，默认 now' }, { name: 'step', description: '步长，默认 60' }, { name: 'timeout', description: '服务端查询超时' }], prepare({ args, options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.queryRange(queryRangeInput(options, args.join(' ')), callOptions)); } },
		{ name: 'series', description: '列出匹配的 time series', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.series(seriesInput(options), callOptions)); } },
		{ name: 'labels', description: '列出 label 名称', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.labels(labelsInput(options), callOptions)); } },
		{ name: 'label-values', aliases: ['values'], description: '列出指定 label 的值', arguments: '<label>', options: rangeOptions, table: (value) => table((value as { data?: unknown }).data), prepare({ args, options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.labelValues(labelValuesInput(options, args[0] ?? ''), callOptions)); } },
		{ name: 'metadata', description: '列出 metric metadata', options: [{ name: 'limit', description: '返回数量上限' }, { name: 'metric', description: 'metric 名称' }], prepare({ options }) { return async (service, callOptions) => sanitizePrometheusOutput(await service.metadata(metadataInput(options), callOptions)); } },
	],
};
