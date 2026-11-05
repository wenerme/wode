import { redactApolloValue } from '../apollo/core/redactor';
import { type FetchRequest, FetchRequestSchema } from '../fetch';
import { type ServiceProviderDefinition, ServiceRegistry } from '../registry';
import { type SearchRequest, SearchRequestSchema } from '../search';
import { ApolloToolInputs, ApolloTools, ApolloWriteOperations } from './apollo-tools';
import { OpenObserveToolInputs, OpenObserveTools, OpenObserveWriteOperations } from './openobserve-tools';
import { getServiceOptionsJsonSchema } from './getServiceOptionsJsonSchema';
import type { ServiceOperation, ServiceProvider, ServiceSchema, ServiceTool } from './types';

const inputs = {
	search: SearchRequestSchema,
	fetch: FetchRequestSchema,
};

const tools: ServiceSchema['tools'] = {
	search: {
		description: 'Search the web',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string', minLength: 1, pattern: '\\S' },
				limit: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER, default: 10 },
				offset: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER, default: 0 },
				urls: { type: 'array', items: { type: 'string', format: 'uri' } },
				includeDomains: { type: 'array', items: { type: 'string', minLength: 1 } },
				excludeDomains: { type: 'array', items: { type: 'string', minLength: 1 } },
				range: { type: 'string' },
				from: { type: 'string' },
				to: { type: 'string' },
				searchType: { type: 'string', minLength: 1 },
				category: { type: 'string', minLength: 1 },
				cursor: { type: 'string' },
				raw: { type: 'boolean', default: false },
				content: {
					type: 'object',
					additionalProperties: false,
					properties: {
						text: { type: 'boolean' },
						summary: { type: 'boolean' },
						highlights: { type: 'boolean' },
						live: { type: 'boolean' },
						maxCharacters: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
					},
				},
			},
			required: ['query'],
			additionalProperties: false,
		},
		annotations: { readOnlyHint: true, destructiveHint: false },
	},
	fetch: {
		description: 'Fetch web page content',
		inputSchema: {
			type: 'object',
			properties: {
				url: { type: 'string', format: 'uri' },
				maxCharacters: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
				text: { type: 'boolean', default: true },
				summary: { type: 'boolean' },
				highlights: { type: 'boolean' },
				live: { type: 'boolean' },
				main: { type: 'boolean', default: true },
				metadata: { type: 'boolean' },
				raw: { type: 'boolean', default: false },
			},
			required: ['url'],
			additionalProperties: false,
		},
		annotations: { readOnlyHint: true, destructiveHint: false },
	},
};

/** 将领域能力暴露给 schema/call transport，实例与关闭仍由 typed registry 管理。 */
export function createServiceProviderAdapter(definition: ServiceProviderDefinition): ServiceProvider {
	const provides: readonly string[] = [...definition.provides];
	const hasOperations = definition.operations !== undefined;
	const operations = new Map<string, ServiceOperation>();
	const staticTools: Record<string, ServiceTool> = Object.create(null);
	function addTool(name: string, tool: ServiceTool) {
		if (!name.trim() || Object.hasOwn(staticTools, name)) throw new TypeError('Conflicting service operation');
		if (!tool || typeof tool !== 'object' || !tool.inputSchema || typeof tool.inputSchema !== 'object' || Array.isArray(tool.inputSchema))
			throw new TypeError('Invalid service operation metadata');
		staticTools[name] = structuredClone(tool);
	}
	if (hasOperations) {
		if (!definition.operations || typeof definition.operations !== 'object' || Array.isArray(definition.operations))
			throw new TypeError('Invalid service operations');
		for (const [name, operation] of Object.entries(definition.operations)) {
			if (!operation || !provides.includes(operation.capability) || typeof operation.execute !== 'function' ||
				!operation.input || typeof operation.input.safeParse !== 'function')
				throw new TypeError('Invalid service operation declaration');
			addTool(name, operation.tool);
			operations.set(name, { ...operation, tool: staticTools[name] });
		}
	} else {
		for (const capability of provides) {
			if (Object.hasOwn(tools, capability)) addTool(capability, tools[capability]);
			const domainTools = capability === 'apollo' ? ApolloTools : capability === 'openobserve' ? OpenObserveTools : undefined;
			for (const [name, tool] of Object.entries(domainTools ?? {})) addTool(name, tool);
		}
	}
	return {
		name: definition.name,
		title: definition.title,
		description: definition.description,
		documentationUrl: definition.documentationUrl,
		examples: definition.examples === undefined ? undefined : structuredClone(definition.examples),
		deferConfigResolution: true,
		aliases: definition.aliases,
		capabilities: definition.provides,
		optionsSchema: definition.optionsSchema === undefined ? undefined : {
			safeParse: definition.optionsSchema.safeParse.bind(definition.optionsSchema),
			jsonSchema: getServiceOptionsJsonSchema(definition.optionsSchema),
		},
		contract: definition.contract,
		tools: structuredClone(staticTools),
		create({ name, config, fetch, sqlDriver, redisDriver, edgeTtsSocketFactory, getEnv }) {
			const registry = new ServiceRegistry({ context: { services: { [name]: config } }, fetch, sqlDriver, redisDriver, edgeTtsSocketFactory, getEnv });
			registry.register(definition);
			return {
				async getSchema() {
					return structuredClone({ tools: staticTools });
				},
				async call(tool, input, options) {
					options?.signal?.throwIfAborted();
					if (hasOperations) {
						const operation = operations.get(tool);
						if (!operation) throw new Error('Unknown service operation');
						if (config.readOnly !== false && operation.tool.annotations?.readOnlyHint !== true)
							throw new Error('Selected service is read-only');
						return operation.execute(registry, name, input, options);
					}
					if (provides.includes('apollo') && Object.hasOwn(ApolloToolInputs, tool)) {
						const operation = tool as keyof typeof ApolloToolInputs;
						const parsed = ApolloToolInputs[operation].safeParse(input);
						if (!parsed.success) throw new TypeError('Invalid Apollo input');
						if (ApolloWriteOperations.has(operation) && config.readOnly !== false)
							throw new Error('Selected service is read-only');
						const service = await registry.load('apollo', name);
						options?.signal?.throwIfAborted();
						const invoke = service[operation] as (input: unknown) => Promise<unknown>;
						return redactApolloValue(await invoke.call(service, parsed.data));
					}
					if (provides.includes('openobserve') && Object.hasOwn(OpenObserveToolInputs, tool)) {
						const operation = tool as keyof typeof OpenObserveToolInputs;
						const parsed = OpenObserveToolInputs[operation].safeParse(input);
						if (!parsed.success) throw new TypeError('Invalid OpenObserve input');
						if (OpenObserveWriteOperations.has(operation) && config.readOnly !== false)
							throw new Error('Selected service is read-only');
						const service = await registry.load('openobserve', name);
						options?.signal?.throwIfAborted();
						switch (operation) {
							case 'health':
								return service.health(options);
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
							case 'getStreamSettings':
								return service.getStreamSettings(OpenObserveToolInputs.getStreamSettings.parse(parsed.data), options);
							case 'updateStreamSettings':
								return service.updateStreamSettings(
									OpenObserveToolInputs.updateStreamSettings.parse(parsed.data),
									options,
								);
							case 'deleteStream':
								return service.deleteStream(OpenObserveToolInputs.deleteStream.parse(parsed.data), options);
							case 'ingestJson':
								return service.ingestJson(OpenObserveToolInputs.ingestJson.parse(parsed.data), options);
							case 'ingestMulti':
								return service.ingestMulti(OpenObserveToolInputs.ingestMulti.parse(parsed.data), options);
							case 'getValues':
								return service.getValues(OpenObserveToolInputs.getValues.parse(parsed.data), options);
							case 'searchAround':
								return service.searchAround(OpenObserveToolInputs.searchAround.parse(parsed.data), options);
						}
					}
					if (!provides.includes(tool)) throw new Error('Unknown service operation');
					if (tool !== 'search' && tool !== 'fetch') throw new Error('Unknown service operation');
					const parsed = inputs[tool].safeParse(input);
					if (!parsed.success) throw new TypeError('Invalid service input');
					if (tool === 'search') {
						const service = await registry.load('search', name);
						options?.signal?.throwIfAborted();
						return service.search(parsed.data as SearchRequest, options);
					}
					if (tool === 'fetch') {
						const service = await registry.load('fetch', name);
						options?.signal?.throwIfAborted();
						return service.fetch(parsed.data as FetchRequest, options);
					}
					throw new Error('Unknown service operation');
				},
				close: () => registry.close(),
			};
		},
	};
}
