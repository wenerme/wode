import { type ServiceProviderDefinition, ServiceRegistry } from '../registry';
import { getServiceOptionsJsonSchema } from './getServiceOptionsJsonSchema';
import type { ServiceOperation, ServiceProvider, ServiceSchema, ServiceTool } from './types';

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
		// All provider definitions declare `operations`; this branch only guards future providers that don't yet.
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
					throw new Error('Unknown service operation');
				},
				close: () => registry.close(),
			};
		},
	};
}
