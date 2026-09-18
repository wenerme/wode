import { snakeCase } from 'es-toolkit';
import set from 'es-toolkit/compat/set';
import type { ZodType } from 'zod/v4';
import { z } from 'zod/v4';

import type { JsonSchemaDef } from '../../jsonschema/types.d';
import type { SchemaOutput } from '../../schema/TypeSchema';
import { toJsonSchema } from '../../schema/toJsonSchema';

export interface LoadEnvConfOptions {
	name?: string;
	env?: Record<string, string | undefined>;
}

export function loadEnvConf<S extends ZodType>(
	schema: S,
	{ env = globalThis.process?.env ?? {}, name = env.APP_NAME }: LoadEnvConfOptions = {},
): SchemaOutput<S> {
	const jsonSchema = toJsonSchema(schema);
	if (!jsonSchema.properties) throw new Error('loadEnvConf requires a Zod object schema');

	const prefix = name ? toEnvName(name, 'application name') : undefined;
	const input: Record<string, unknown> = {};
	const owners = new Map<string, string>();

	for (const binding of collectBindings(jsonSchema)) {
		const envName = resolveEnvName(binding.schema, binding.path);
		const owner = binding.path.join('.');
		const previousOwner = owners.get(envName);
		if (previousOwner !== undefined) {
			throw new Error(`Environment name ${envName} is shared by ${previousOwner} and ${owner}`);
		}
		owners.set(envName, owner);

		const candidates = prefix ? [`${prefix}_${envName}`, envName] : [envName];
		const selected = candidates.find((candidate) => env[candidate] !== undefined);
		if (selected !== undefined) set(input, binding.path, env[selected]);
	}

	return z.parse(schema, input) as SchemaOutput<S>;
}

interface EnvBinding {
	readonly path: string[];
	readonly schema: JsonSchemaDef;
}

function collectBindings(schema: JsonSchemaDef, path: string[] = []): EnvBinding[] {
	if (!schema.properties) return path.length > 0 ? [{ path, schema }] : [];
	return Object.entries(schema.properties).flatMap(([key, property]) => {
		if (['__proto__', 'prototype', 'constructor'].includes(key)) {
			throw new Error('Unsafe environment schema property');
		}
		return collectBindings(property, [...path, key]);
	});
}

function resolveEnvName(schema: JsonSchemaDef, path: string[]): string {
	const explicit = schema['x-env-name'];
	if (explicit !== undefined) {
		if (typeof explicit !== 'string' || !/^[A-Z][A-Z0-9_]*$/u.test(explicit)) {
			throw new Error('x-env-name must be an upper snake case environment name');
		}
		return explicit;
	}
	return path.map((segment) => toEnvName(segment, 'schema property')).join('_');
}

function toEnvName(value: string, label: string): string {
	const normalized = snakeCase(value).toUpperCase();
	if (!normalized || !/^[A-Z][A-Z0-9_]*$/u.test(normalized)) {
		throw new Error(`Invalid ${label}`);
	}
	return normalized;
}
