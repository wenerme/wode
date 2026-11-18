import type { ServiceOptionsSchema } from './types';

/** Static discovery only: never validate configuration or instantiate a provider. */
export function getServiceOptionsJsonSchema(schema: ServiceOptionsSchema | undefined): Record<string, unknown> | undefined {
	if (schema?.jsonSchema !== undefined) return structuredClone(schema.jsonSchema);
	if (typeof schema?.toJSONSchema === 'function') return structuredClone(schema.toJSONSchema({ io: 'input' }));
	return undefined;
}
