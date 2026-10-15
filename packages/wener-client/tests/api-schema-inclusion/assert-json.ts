import assert from 'node:assert/strict';

/** Compare JSON values without depending on object key order or floating-point serialization. */
export function assertJsonStructureEqual(expected: unknown, actual: unknown, path = '$'): void {
	if (typeof expected === 'number' && typeof actual === 'number') {
		assert(Number.isFinite(expected) && Number.isFinite(actual), `${path}: non-JSON number`);
		if (Number.isInteger(expected) || Number.isInteger(actual)) {
			assert.equal(actual, expected, `${path}: integer changed`);
			return;
		}
		const tolerance = 1e-9 * Math.max(1, Math.abs(expected), Math.abs(actual));
		assert(Math.abs(expected - actual) <= tolerance, `${path}: number changed (${expected} -> ${actual})`);
		return;
	}
	if (Array.isArray(expected)) {
		assert(Array.isArray(actual), `${path}: array changed type`);
		assert.equal(actual.length, expected.length, `${path}: array length changed`);
		for (let index = 0; index < expected.length; index++) {
			assertJsonStructureEqual(expected[index], actual[index], `${path}[${index}]`);
		}
		return;
	}
	if (expected !== null && typeof expected === 'object') {
		assert(actual !== null && typeof actual === 'object' && !Array.isArray(actual), `${path}: object changed type`);
		assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${path}: object keys changed`);
		for (const [key, value] of Object.entries(expected)) {
			assertJsonStructureEqual(value, (actual as Record<string, unknown>)[key], `${path}[${JSON.stringify(key)}]`);
		}
		return;
	}
	assert.equal(actual, expected, `${path}: JSON value changed`);
}

export type OfficialValidator = ((value: unknown) => boolean) & { errors?: unknown };

/** The official validator is the oracle; a local superset need not satisfy the converse implication. */
export function assertOfficialIncluded(
	validate: OfficialValidator,
	parse: (value: unknown) => unknown,
	value: unknown,
): void {
	assert(validate(value), `Generator produced invalid official JSON: ${JSON.stringify(validate.errors)}`);
	const original = structuredClone(value);
	const parsed = parse(value);
	assertJsonStructureEqual(original, value);
	assertJsonStructureEqual(original, parsed);
	assert(validate(parsed), `Parsed JSON no longer satisfies the official schema: ${JSON.stringify(validate.errors)}`);
}
