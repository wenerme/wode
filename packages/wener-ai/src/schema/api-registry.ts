import {
	type ApiEndpointMatcher,
	type ApiFamilyDefinition,
	type ApiTypeDefinition,
	defineApiFamily,
	defineApiType,
} from './api-definition';

export type ParsedApiEndpoint = Readonly<{
	raw: string;
	apiType: string;
	family: string;
	capability: string;
	version: string;
	prefix: string;
	operation: string;
	model: string;
	/** Undefined means that the endpoint path alone cannot decide streaming. */
	streaming: boolean | undefined;
}>;

export type ApiEndpointParseResult =
	| Readonly<{ status: 'matched'; endpoint: ParsedApiEndpoint }>
	| Readonly<{ status: 'unknown'; raw: string }>
	| Readonly<{ status: 'ambiguous'; raw: string; candidates: readonly ParsedApiEndpoint[] }>;

export type ApiRegistryInput = {
	families?: readonly ApiFamilyDefinition[];
	apiTypes?: readonly ApiTypeDefinition[];
};

export type ApiRegistry = Readonly<{
	families: readonly ApiFamilyDefinition[];
	apiTypes: readonly ApiTypeDefinition[];
	resolveFamily: (nameOrAlias: string) => ApiFamilyDefinition | undefined;
	resolveApiType: (nameOrAlias: string) => ApiTypeDefinition | undefined;
	resolveApiTypeName: (nameOrAlias: string) => string | undefined;
	parseEndpoint: (pathOrUrl: string) => ApiEndpointParseResult;
	extend: (extension: ApiRegistryInput) => ApiRegistry;
}>;

export function createApiRegistry(input: ApiRegistryInput = {}): ApiRegistry {
	const families = Object.freeze((input.families ?? []).map((family) => defineApiFamily(family)));
	const familyLookup = createDefinitionLookup(families, 'API family');
	const apiTypes = Object.freeze(
		(input.apiTypes ?? []).map((inputApiType) => {
			const apiType = defineApiType(inputApiType);
			const family = familyLookup.get(apiType.family.name);
			if (!family) {
				throw new TypeError(`API type ${apiType.name} references unknown family ${apiType.family.name}`);
			}
			return defineApiType({ ...apiType, family });
		}),
	);
	const apiTypeLookup = createDefinitionLookup(apiTypes, 'API type');

	const registry: ApiRegistry = {
		families,
		apiTypes,
		resolveFamily(nameOrAlias) {
			return familyLookup.get(nameOrAlias);
		},
		resolveApiType(nameOrAlias) {
			return apiTypeLookup.get(nameOrAlias);
		},
		resolveApiTypeName(nameOrAlias) {
			return apiTypeLookup.get(nameOrAlias)?.name;
		},
		parseEndpoint(pathOrUrl) {
			return parseEndpoint(apiTypes, pathOrUrl);
		},
		extend(extension) {
			return createApiRegistry({
				families: [...families, ...(extension.families ?? [])],
				apiTypes: [...apiTypes, ...(extension.apiTypes ?? [])],
			});
		},
	};
	return Object.freeze(registry);
}

function createDefinitionLookup<T extends ApiFamilyDefinition | ApiTypeDefinition>(
	definitions: readonly T[],
	label: string,
): Map<string, T> {
	const lookup = new Map<string, T>();
	for (const definition of definitions) {
		addLookupEntry(lookup, definition.name, definition, label);
	}
	for (const definition of definitions) {
		for (const alias of definition.aliases ?? []) addLookupEntry(lookup, alias, definition, `${label} alias`);
	}
	return lookup;
}

function addLookupEntry<T>(lookup: Map<string, T>, key: string, value: T, label: string): void {
	if (lookup.has(key)) throw new TypeError(`${label} collision: ${key}`);
	lookup.set(key, value);
}

function parseEndpoint(apiTypes: readonly ApiTypeDefinition[], pathOrUrl: string): ApiEndpointParseResult {
	const raw = normalizeEndpointPath(pathOrUrl);
	const segments = splitEndpointPath(raw);
	if (segments.length === 0) return Object.freeze({ status: 'unknown', raw });

	const candidates: EndpointCandidate[] = [];
	for (const apiType of apiTypes) {
		for (const operation of apiType.operations) {
			const matched = matchEndpoint(operation.matcher, segments);
			if (!matched) continue;
			candidates.push({
				matcherKind: matched.matcherKind,
				specificity: matched.specificity,
				endpoint: Object.freeze({
					raw,
					apiType: apiType.name,
					family: apiType.family.name,
					capability: apiType.capability,
					version: matched.version,
					prefix: matched.prefix,
					operation: operation.name,
					model: matched.model,
					streaming: operation.streaming,
				}),
			});
		}
	}

	const narrowed = preferLongestSuffix(candidates);
	if (narrowed.length === 0) return Object.freeze({ status: 'unknown', raw });
	if (narrowed.length === 1) return Object.freeze({ status: 'matched', endpoint: narrowed[0].endpoint });
	return Object.freeze({
		status: 'ambiguous',
		raw,
		candidates: Object.freeze(narrowed.map(({ endpoint }) => endpoint)),
	});
}

type EndpointCandidate = {
	endpoint: ParsedApiEndpoint;
	matcherKind: ApiEndpointMatcher['kind'];
	specificity: number;
};

type EndpointMatch = {
	version: string;
	prefix: string;
	operation: string;
	model: string;
	matcherKind: ApiEndpointMatcher['kind'];
	specificity: number;
};

function matchEndpoint(matcher: ApiEndpointMatcher, segments: readonly string[]): EndpointMatch | undefined {
	switch (matcher.kind) {
		case 'suffix':
			return matchSuffixEndpoint(matcher.segments, segments);
		case 'bedrock':
			return matchBedrockEndpoint(matcher.operation, segments);
		case 'google':
			return matchGoogleEndpoint(matcher.platform, matcher.operation, segments);
	}
}

function matchSuffixEndpoint(suffix: readonly string[], segments: readonly string[]): EndpointMatch | undefined {
	if (!hasSegmentSuffix(segments, suffix)) return undefined;
	const leading = segments.slice(0, segments.length - suffix.length);
	const { version, prefix } = endpointVersionAndPrefix(leading);
	return {
		version,
		prefix,
		operation: suffix.join('/'),
		model: '',
		matcherKind: 'suffix',
		specificity: suffix.length,
	};
}

function matchBedrockEndpoint(operation: string, segments: readonly string[]): EndpointMatch | undefined {
	if (segments.length < 3 || segments[0] !== 'model' || segments.at(-1) !== operation) return undefined;
	return {
		version: '',
		prefix: '',
		operation,
		model: segments.slice(1, -1).join('/'),
		matcherKind: 'bedrock',
		specificity: segments.length,
	};
}

function matchGoogleEndpoint(
	platform: 'generative-ai' | 'vertex',
	operation: string,
	segments: readonly string[],
): EndpointMatch | undefined {
	for (let index = 1; index < segments.length; index++) {
		if (index !== segments.length - 1 || segments[index - 1] !== 'models') continue;
		const separator = segments[index].indexOf(':');
		if (separator <= 0 || segments[index].slice(separator + 1) !== operation) continue;
		const leading = segments.slice(0, index - 1);
		const vertex = hasVertexGooglePublisherPrefix(leading);
		if ((platform === 'vertex') !== vertex) continue;
		const { version, prefix } = endpointVersionAndPrefix(leading);
		return {
			version,
			prefix,
			operation,
			model: segments[index].slice(0, separator),
			matcherKind: 'google',
			specificity: segments.length,
		};
	}
	return undefined;
}

function preferLongestSuffix(candidates: readonly EndpointCandidate[]): EndpointCandidate[] {
	let longestSuffix = 0;
	for (const candidate of candidates) {
		if (candidate.matcherKind === 'suffix') longestSuffix = Math.max(longestSuffix, candidate.specificity);
	}
	return candidates.filter(
		(candidate) => candidate.matcherKind !== 'suffix' || candidate.specificity === longestSuffix,
	);
}

function hasVertexGooglePublisherPrefix(segments: readonly string[]): boolean {
	return segments.some((segment, index) => segment === 'publishers' && segments[index + 1] === 'google');
}

function normalizeEndpointPath(pathOrUrl: string): string {
	let value = pathOrUrl.trim();
	if (value === '') return '';
	if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//iu.test(value)) {
		try {
			return new URL(value, 'http://endpoint.invalid').pathname;
		} catch {
			// Fall through so malformed URLs still receive deterministic path normalization.
		}
	}
	const query = value.indexOf('?');
	if (query >= 0) value = value.slice(0, query);
	const fragment = value.indexOf('#');
	if (fragment >= 0) value = value.slice(0, fragment);
	return value;
}

function splitEndpointPath(path: string): string[] {
	return path
		.split('/')
		.filter(Boolean)
		.map((segment) => {
			try {
				return decodeURIComponent(segment);
			} catch {
				return segment;
			}
		});
}

function hasSegmentSuffix(segments: readonly string[], suffix: readonly string[]): boolean {
	if (suffix.length > segments.length) return false;
	const start = segments.length - suffix.length;
	return suffix.every((segment, index) => segments[start + index] === segment);
}

const ApiVersionPattern = /^v[0-9]+(?:[a-z]+[0-9]*)?$/u;

function endpointVersionAndPrefix(segments: readonly string[]): { version: string; prefix: string } {
	for (let index = segments.length - 1; index >= 0; index--) {
		if (!ApiVersionPattern.test(segments[index])) continue;
		return { version: segments[index], prefix: segments.slice(0, index).join('/') };
	}
	return { version: '', prefix: segments.join('/') };
}
