export type DeepReadonly<T> = T extends (...args: never[]) => unknown
	? T
	: T extends readonly (infer Item)[]
		? readonly DeepReadonly<Item>[]
		: T extends object
			? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
			: T;

export type SuffixEndpointMatcher = {
	kind: 'suffix';
	segments: readonly string[];
};

export type BedrockEndpointMatcher = {
	kind: 'bedrock';
	operation: 'converse' | 'converse-stream' | 'invoke' | 'invoke-with-response-stream';
};

export type GoogleEndpointMatcher = {
	kind: 'google';
	operation: 'generateContent' | 'streamGenerateContent';
	platform: 'generative-ai' | 'vertex';
};

export type ApiEndpointMatcher = SuffixEndpointMatcher | BedrockEndpointMatcher | GoogleEndpointMatcher;

export type ApiOperationDefinitionInput = {
	name: string;
	matcher: ApiEndpointMatcher;
	/** Undefined means that the request body or protocol semantics decide streaming. */
	streaming?: boolean;
};

export type ApiOperationDefinition = DeepReadonly<ApiOperationDefinitionInput>;

export type ApiFamilyDefinitionInput = {
	name: string;
	title?: string;
	description?: string;
	aliases?: readonly string[];
	capabilities?: readonly string[];
};

export type ApiFamilyDefinition = DeepReadonly<ApiFamilyDefinitionInput>;

export type ApiTypeDefinitionInput = {
	name: string;
	family: ApiFamilyDefinition;
	capability: string;
	title?: string;
	description?: string;
	aliases?: readonly string[];
	operations: readonly ApiOperationDefinition[];
};

export type ApiTypeDefinition = DeepReadonly<ApiTypeDefinitionInput>;

export function defineApiOperation(input: ApiOperationDefinitionInput): ApiOperationDefinition {
	assertName(input.name, 'API operation');
	return cloneAndFreeze(input);
}

export function defineApiFamily(input: ApiFamilyDefinitionInput): ApiFamilyDefinition {
	assertName(input.name, 'API family');
	assertAliases(input.aliases, `API family ${input.name}`);
	return cloneAndFreeze(input);
}

export function defineApiType(input: ApiTypeDefinitionInput): ApiTypeDefinition {
	assertName(input.name, 'API type');
	assertName(input.family.name, `API type ${input.name} family`);
	assertName(input.capability, `API type ${input.name} capability`);
	assertAliases(input.aliases, `API type ${input.name}`);
	if (input.operations.length === 0) {
		throw new TypeError(`API type ${input.name} requires at least one operation`);
	}
	return cloneAndFreeze(input);
}

export function cloneAndFreeze<T>(input: T): DeepReadonly<T> {
	return cloneValue(input, new WeakMap<object, unknown>()) as DeepReadonly<T>;
}

function cloneValue(input: unknown, seen: WeakMap<object, unknown>): unknown {
	if (input === null || typeof input !== 'object') return input;
	const existing = seen.get(input);
	if (existing) return existing;

	if (Array.isArray(input)) {
		const output: unknown[] = [];
		seen.set(input, output);
		for (const item of input) output.push(cloneValue(item, seen));
		return Object.freeze(output);
	}

	const prototype = Object.getPrototypeOf(input);
	if (prototype !== Object.prototype && prototype !== null) {
		throw new TypeError('API definitions only accept plain objects and arrays');
	}
	const output = Object.create(null) as Record<string, unknown>;
	seen.set(input, output);
	for (const [key, value] of Object.entries(input)) {
		Object.defineProperty(output, key, {
			configurable: false,
			enumerable: true,
			value: cloneValue(value, seen),
			writable: false,
		});
	}
	return Object.freeze(output);
}

function assertName(value: string, label: string): void {
	if (value.trim() === '') throw new TypeError(`${label} name must not be empty`);
}

function assertAliases(aliases: readonly string[] | undefined, label: string): void {
	if (!aliases) return;
	const seen = new Set<string>();
	for (const alias of aliases) {
		assertName(alias, `${label} alias`);
		if (seen.has(alias)) throw new TypeError(`${label} repeats alias ${alias}`);
		seen.add(alias);
	}
}
