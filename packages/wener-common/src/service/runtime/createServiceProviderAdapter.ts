import { z } from 'zod';
import type { FetchRequest } from '../fetch';
import { type ServiceProviderDefinition, ServiceRegistry } from '../registry';
import type { SearchRequest } from '../search';
import { OpenObserveToolInputs, OpenObserveTools, OpenObserveWriteOperations } from './openobserve-tools';
import { PrometheusToolInputs, PrometheusTools } from './prometheus-tools';
import { SqlToolInputs, SqlTools } from './sql-tools';
import type { ServiceProvider, ServiceSchema } from './types';

const inputs = {
	search: z.strictObject({
		query: z.string().regex(/\S/),
		limit: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
		offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
	}),
	fetch: z.strictObject({
		url: z.string().min(1),
		maxCharacters: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
	}),
};

const tools: ServiceSchema['tools'] = {
	search: {
		description: '搜索网页',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string', minLength: 1, pattern: '\\S' },
				limit: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER, default: 10 },
				offset: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER, default: 0 },
			},
			required: ['query'],
			additionalProperties: false,
		},
		annotations: { readOnlyHint: true, destructiveHint: false },
	},
	fetch: {
		description: '获取网页内容',
		inputSchema: {
			type: 'object',
			properties: { url: { type: 'string', format: 'uri' }, maxCharacters: { type: 'integer', minimum: 1 } },
			required: ['url'],
			additionalProperties: false,
		},
		annotations: { readOnlyHint: true, destructiveHint: false },
	},
};

/** 将领域能力暴露给 schema/call transport，实例与关闭仍由 typed registry 管理。 */
export function createServiceProviderAdapter(definition: ServiceProviderDefinition): ServiceProvider {
	const provides: readonly string[] = [...definition.provides];
	return {
		name: definition.name,
		aliases: definition.aliases,
		create({ name, config, fetch, sqlDriver, getEnv }) {
			const registry = new ServiceRegistry({ context: { services: { [name]: config } }, fetch, sqlDriver, getEnv });
			registry.register(definition);
			return {
				async getSchema() {
					return structuredClone({
						tools: {
							...Object.fromEntries(
								definition.provides.filter((key) => Object.hasOwn(tools, key)).map((key) => [key, tools[key]]),
							),
							...(provides.includes('sql') ? SqlTools : {}),
							...(provides.includes('openobserve') ? OpenObserveTools : {}),
							...(provides.includes('prometheus') ? PrometheusTools : {}),
						},
					});
				},
				async call(tool, input, options) {
					options?.signal?.throwIfAborted();
					if (provides.includes('sql') && Object.hasOwn(SqlToolInputs, tool)) {
						const operation = tool as keyof typeof SqlToolInputs;
						const parsed = SqlToolInputs[operation].safeParse(input);
						if (!parsed.success) throw new TypeError('Invalid SQL input');
						if (operation === 'exec' && config.readOnly !== false) throw new Error('Selected service is read-only');
						const sql = await registry.load('sql', name);
						switch (operation) {
							case 'ping':
								return sql.ping(options);
							case 'query':
								return sql.query(SqlToolInputs.query.parse(parsed.data), options);
							case 'exec':
								return sql.exec(SqlToolInputs.exec.parse(parsed.data), options);
							case 'listObject':
								return sql.listObject(SqlToolInputs.listObject.parse(parsed.data), options);
							case 'describeObject':
								return sql.describeObject(SqlToolInputs.describeObject.parse(parsed.data), options);
						}
					}
					if (provides.includes('prometheus') && Object.hasOwn(PrometheusToolInputs, tool)) {
						const operation = tool as keyof typeof PrometheusToolInputs;
						const parsed = PrometheusToolInputs[operation].safeParse(input);
						if (!parsed.success) throw new TypeError('Invalid Prometheus input');
						const service = await registry.load('prometheus', name);
						switch (operation) {
							case 'query': return service.query(PrometheusToolInputs.query.parse(parsed.data), options);
							case 'queryRange': return service.queryRange(PrometheusToolInputs.queryRange.parse(parsed.data), options);
							case 'series': return service.series(PrometheusToolInputs.series.parse(parsed.data), options);
							case 'labels': return service.labels(PrometheusToolInputs.labels.parse(parsed.data), options);
							case 'labelValues': return service.labelValues(PrometheusToolInputs.labelValues.parse(parsed.data), options);
							case 'metadata': return service.metadata(PrometheusToolInputs.metadata.parse(parsed.data), options);
						}
					}
					if (provides.includes('openobserve') && Object.hasOwn(OpenObserveToolInputs, tool)) {
						const operation = tool as keyof typeof OpenObserveToolInputs;
						const parsed = OpenObserveToolInputs[operation].safeParse(input);
						if (!parsed.success) throw new TypeError('Invalid OpenObserve input');
						if (OpenObserveWriteOperations.has(operation) && config.readOnly !== false) throw new Error('Selected service is read-only');
						const service = await registry.load('openobserve', name);
						switch (operation) {
							case 'health': return service.health(options);
							case 'status':
								return service.status(parsed.data, options);
							case 'listStreams':
								return service.listStreams(parsed.data, options);
							case 'getStreamSchema':
								return service.getStreamSchema(OpenObserveToolInputs.getStreamSchema.parse(parsed.data), options);
							case 'search':
								return service.search(OpenObserveToolInputs.search.parse(parsed.data), options);
							case 'listTraces':
								return service.listTraces(OpenObserveToolInputs.listTraces.parse(parsed.data), options);
							case 'getStreamSettings': return service.getStreamSettings(OpenObserveToolInputs.getStreamSettings.parse(parsed.data), options);
							case 'updateStreamSettings': return service.updateStreamSettings(OpenObserveToolInputs.updateStreamSettings.parse(parsed.data), options);
							case 'deleteStream': return service.deleteStream(OpenObserveToolInputs.deleteStream.parse(parsed.data), options);
							case 'ingestJson': return service.ingestJson(OpenObserveToolInputs.ingestJson.parse(parsed.data), options);
							case 'ingestMulti': return service.ingestMulti(OpenObserveToolInputs.ingestMulti.parse(parsed.data), options);
							case 'getValues': return service.getValues(OpenObserveToolInputs.getValues.parse(parsed.data), options);
							case 'searchAround': return service.searchAround(OpenObserveToolInputs.searchAround.parse(parsed.data), options);
						}
					}
					if (!provides.includes(tool)) throw new Error('Unknown service operation');
					if (tool !== 'search' && tool !== 'fetch') throw new Error('Unknown service operation');
					const parsed = inputs[tool].safeParse(input);
					if (!parsed.success) throw new TypeError('Invalid service input');
					if (tool === 'search')
						return (await registry.load('search', name)).search(parsed.data as SearchRequest, options);
					if (tool === 'fetch') return (await registry.load('fetch', name)).fetch(parsed.data as FetchRequest, options);
					throw new Error('Unknown service operation');
				},
				close: () => registry.close(),
			};
		},
	};
}
