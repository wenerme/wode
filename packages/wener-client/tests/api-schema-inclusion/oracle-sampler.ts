import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020';
import { generate } from 'json-schema-faker';
import { generationView } from './generation-view';

export type Schema = Record<string, unknown>;
export type OracleContract = { name: string; target: string; schema: Schema };
export type Oracle = {
	source: { url: string; sha256: string };
	cases: OracleContract[];
	$defs: Record<string, Schema>;
};
export type OracleVendor = 'openai' | 'anthropic' | 'gemini';

const validators = new Ajv({ strict: false, validateFormats: false, allErrors: true, inlineRefs: false });
const valueValidators = new Ajv({ strict: false, validateFormats: false, allErrors: true, inlineRefs: false });
const oracles = new Map<OracleVendor, Oracle>();

/**
 * Value-only view of an official schema: drops `required` and turns `oneOf` into `anyOf`.
 * Official specs mark many nullable or echoed server fields as required; converted output should not invent them,
 * so presence is checked by the local Zod schema while this view checks the types, enums and ranges of present values.
 */
function valueView(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(valueView);
	if (value === null || typeof value !== 'object') return value;
	return Object.fromEntries(
		Object.entries(value)
			.filter(([key]) => key !== 'required')
			.map(([key, child]) => [key === 'oneOf' ? 'anyOf' : key, valueView(child)]),
	);
}

/** Loads an offline oracle and registers its definitions for validation; repeated calls reuse it. */
export function loadOracle(vendor: OracleVendor): Oracle {
	let oracle = oracles.get(vendor);
	if (oracle) return oracle;
	oracle = JSON.parse(readFileSync(new URL(`./oracles/${vendor}.json`, import.meta.url), 'utf8')) as Oracle;
	validators.addSchema({ $id: oracleId(vendor), $defs: oracle.$defs });
	valueValidators.addSchema({ $id: oracleId(vendor), $defs: valueView(oracle.$defs) });
	oracles.set(vendor, oracle);
	return oracle;
}

function oracleId(vendor: OracleVendor) {
	return `urn:wener:api-oracle:${vendor}`;
}

function validationRefs(id: string, value: unknown): unknown {
	if (Array.isArray(value)) return value.map((child) => validationRefs(id, child));
	if (value === null || typeof value !== 'object') return value;
	return Object.fromEntries(
		Object.entries(value).map(([key, child]) => [
			key,
			key === '$ref' && typeof child === 'string' ? `${id}${child}` : validationRefs(id, child),
		]),
	);
}

export function findContract(vendor: OracleVendor, name: string): OracleContract {
	const contract = loadOracle(vendor).cases.find((item) => item.name === name);
	assert(contract, `Missing ${vendor} oracle contract: ${name}`);
	return contract;
}

export function compileContract(vendor: OracleVendor, contract: OracleContract, { values = false } = {}) {
	loadOracle(vendor);
	const schema = validationRefs(oracleId(vendor), contract.schema) as Schema;
	return values ? valueValidators.compile(valueView(schema) as Schema) : validators.compile(schema);
}

/** Expands top-level `$ref` and `oneOf`/`anyOf` so each branch is sampled. */
export function contractBranches(vendor: OracleVendor, contract: OracleContract): Schema[] {
	const { $defs } = loadOracle(vendor);
	const expand = (schema: Schema, seen: Set<string>): Schema[] => {
		if (typeof schema.$ref === 'string') {
			if (seen.has(schema.$ref)) return [schema];
			const name = schema.$ref.slice('#/$defs/'.length).replaceAll('~1', '/').replaceAll('~0', '~');
			return expand($defs[name], new Set([...seen, schema.$ref]));
		}
		const branches = schema.oneOf ?? schema.anyOf;
		return Array.isArray(branches) ? branches.flatMap((branch) => expand(branch as Schema, seen)) : [schema];
	};
	return expand(contract.schema, new Set());
}

/**
 * Generates a JSON sample for `branch` that the official validator accepts.
 * Even runs fill optional fields densely, odd runs sparsely.
 */
export async function sampleOfficial(
	vendor: OracleVendor,
	branch: Schema,
	validate: ReturnType<typeof compileContract>,
	{ seed, run }: { seed: number; run: number },
): Promise<{ sample: unknown; seed: number }> {
	const { $defs } = loadOracle(vendor);
	let lastError: unknown;
	for (let attempt = 0, sampleSeed = seed; attempt < 20; attempt++, sampleSeed++) {
		try {
			const generated = await generate(generationView(branch, $defs, sampleSeed), {
				seed: sampleSeed,
				maxDepth: 32,
				maxDefaultItems: 2,
				minLength: 1,
				alwaysFakeOptionals: run % 2 === 0,
				optionalsProbability: run % 2 === 0 ? 1 : 0.25,
			});
			const sample = JSON.parse(JSON.stringify(generated));
			if (validate(sample)) return { sample, seed: sampleSeed };
			lastError = validate.errors;
		} catch (error) {
			lastError = error;
		}
	}
	throw new Error(
		`${vendor}: no valid official sample; ${lastError instanceof Error ? lastError.message : JSON.stringify(lastError)}`,
	);
}
