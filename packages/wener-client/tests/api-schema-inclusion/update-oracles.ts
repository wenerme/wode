import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { parse as parseYaml } from 'yaml';
import { commonTargets, components, operations, sources } from './catalog';

const directory = new URL('./oracles/', import.meta.url);
const check = process.argv.includes('--check');
const keywords = new Set([
	'$ref',
	'$schema',
	'$defs',
	'type',
	'enum',
	'const',
	'properties',
	'patternProperties',
	'additionalProperties',
	'required',
	'items',
	'prefixItems',
	'additionalItems',
	'minItems',
	'maxItems',
	'uniqueItems',
	'contains',
	'minContains',
	'maxContains',
	'minimum',
	'maximum',
	'exclusiveMinimum',
	'exclusiveMaximum',
	'multipleOf',
	'minLength',
	'maxLength',
	'pattern',
	'format',
	'minProperties',
	'maxProperties',
	'propertyNames',
	'anyOf',
	'oneOf',
	'allOf',
	'not',
	'if',
	'then',
	'else',
	'dependentRequired',
	'dependentSchemas',
	'unevaluatedProperties',
	'unevaluatedItems',
]);

function project(schema, discovery = false) {
	if (typeof schema === 'boolean') return schema;
	const result = {};
	for (const [key, value] of Object.entries(schema)) {
		if (!keywords.has(key)) continue;
		if (key === '$ref') {
			result.$ref = discovery ? `#/$defs/${value}` : value.replace('#/components/schemas/', '#/$defs/');
		} else if (['properties', 'patternProperties', '$defs', 'dependentSchemas'].includes(key)) {
			result[key] = Object.fromEntries(Object.entries(value).map(([name, child]) => [name, project(child, discovery)]));
		} else if (['anyOf', 'oneOf', 'allOf', 'prefixItems'].includes(key)) {
			result[key] = value.map((child) => project(child, discovery));
		} else if (
			[
				'items',
				'additionalProperties',
				'additionalItems',
				'contains',
				'not',
				'if',
				'then',
				'else',
				'propertyNames',
				'unevaluatedProperties',
				'unevaluatedItems',
			].includes(key)
		) {
			result[key] = project(value, discovery);
		} else if (key === 'required') {
			if (Array.isArray(value)) result.required = [...value].sort();
		} else {
			result[key] = value;
		}
	}
	// Discovery's `any` is an unconstrained JSON value, not a JSON Schema type name.
	if (discovery && result.type === 'any') delete result.type;
	if (schema.nullable === true) return { anyOf: [result, { type: 'null' }] };
	if (discovery && schema.properties) {
		const required = Object.entries(schema.properties)
			.filter(([, child]) => child.required === true || /^Required\./.test(child.description ?? ''))
			.map(([name]) => name);
		if (required.length) result.required = [...new Set([...(result.required ?? []), ...required])].sort();
	}
	return result;
}

function referencedDefinitions(roots, definitions) {
	const selected = {};
	function visit(value) {
		if (value === null || typeof value !== 'object') return;
		if (typeof value.$ref === 'string') {
			assert(value.$ref.startsWith('#/$defs/'), `Unsupported reference: ${value.$ref}`);
			const name = decodeURIComponent(value.$ref.slice('#/$defs/'.length)).replaceAll('~1', '/').replaceAll('~0', '~');
			assert(Object.hasOwn(definitions, name), `Missing official definition: ${name}`);
			if (!Object.hasOwn(selected, name)) {
				selected[name] = definitions[name];
				visit(definitions[name]);
			}
		}
		for (const child of Object.values(value)) visit(child);
	}
	for (const root of roots) visit(root);
	return Object.fromEntries(Object.entries(selected).sort(([a], [b]) => a.localeCompare(b)));
}

await mkdir(directory, { recursive: true });
for (const [vendor, defaultUrl] of Object.entries(sources)) {
	const url = vendor === 'anthropic' ? (process.env.ANTHROPIC_OPENAPI_URL ?? defaultUrl) : defaultUrl;
	const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
	assert(response.ok, `${vendor}: source returned ${response.status}`);
	const raw = await response.text();
	const document = raw.trimStart().startsWith('{') ? JSON.parse(raw) : parseYaml(raw);
	const definitions = Object.fromEntries(
		Object.entries(vendor === 'gemini' ? document.schemas : document.components.schemas).map(([name, schema]) => [
			name,
			project(schema, vendor === 'gemini'),
		]),
	);
	const cases = [];
	for (const [provider, path, method, request, result, stream] of operations) {
		if (provider !== vendor) continue;
		const operation = document.paths[path]?.[method];
		assert(operation, `${vendor}: missing operation ${method} ${path}`);
		const success = Object.entries(operation.responses).find(([status]) => /^2\d\d$/.test(status))?.[1];
		for (const [direction, target, schema] of [
			['request', request, operation.requestBody?.content?.['application/json']?.schema],
			['response', result, success?.content?.['application/json']?.schema],
			['stream', stream, success?.content?.['text/event-stream']?.schema],
		]) {
			if (!target) continue;
			assert(schema, `${vendor}: missing ${direction} JSON schema ${method} ${path}`);
			cases.push({ name: `${method.toUpperCase()} ${path} ${direction}`, target, schema: project(schema) });
		}
	}
	for (const [provider, name, target] of components) {
		if (provider !== vendor) continue;
		assert(Object.hasOwn(definitions, name), `${vendor}: missing component ${name}`);
		cases.push({ name: `${name} -> ${target}`, target, schema: { $ref: `#/$defs/${name}` } });
	}
	for (const entry of [...cases]) {
		const target = commonTargets[entry.target];
		if (target) cases.push({ ...entry, name: `${entry.name} (common)`, target });
	}
	const snapshot = {
		source: {
			url,
			sha256: createHash('sha256').update(raw).digest('hex'),
			revision: document.revision ?? null,
			version: document.info?.version ?? null,
			license: document.info?.license ?? null,
		},
		cases,
		$defs: referencedDefinitions(
			cases.map(({ schema }) => schema),
			definitions,
		),
	};
	const destination = new URL(`${vendor}.json`, directory);
	if (check) {
		const previous = JSON.parse(await readFile(destination, 'utf8'));
		// Required field order is immaterial; normalize existing snapshots without changing constraints.
		const previousContracts = {
			cases: previous.cases.map((entry) => ({ ...entry, schema: project(entry.schema) })),
			$defs: Object.fromEntries(Object.entries(previous.$defs).map(([name, schema]) => [name, project(schema)])),
		};
		// Descriptions and transport metadata are deliberately excluded from the structural freshness check.
		assert(
			isDeepStrictEqual({ cases: snapshot.cases, $defs: snapshot.$defs }, previousContracts),
			`${vendor}: upstream contract changed; run update:api-oracles then test:api-inclusion`,
		);
	} else {
		const formatted = spawnSync(
			fileURLToPath(new URL('../../../../node_modules/.bin/biome', import.meta.url)),
			['format', `--stdin-file-path=${fileURLToPath(destination)}`],
			{ input: `${JSON.stringify(snapshot, null, '\t')}\n`, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
		);
		assert.equal(formatted.status, 0, `Snapshot formatting failed: ${formatted.stderr}`);
		await writeFile(destination, formatted.stdout);
	}
	console.log(
		`${vendor}: ${cases.length} contracts, ${Object.keys(snapshot.$defs).length} definitions (${check ? 'current' : fileURLToPath(destination)})`,
	);
}
