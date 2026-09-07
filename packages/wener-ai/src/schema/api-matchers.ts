import {
	type BedrockEndpointMatcher,
	cloneAndFreeze,
	type GoogleEndpointMatcher,
	type SuffixEndpointMatcher,
} from './api-definition';

export function createSuffixEndpointMatcher(suffix: string | readonly string[]): SuffixEndpointMatcher {
	const segments = typeof suffix === 'string' ? suffix.split('/') : [...suffix];
	if (segments.length === 0 || segments.some((segment) => segment.trim() === '')) {
		throw new TypeError('Endpoint suffix requires non-empty path segments');
	}
	return cloneAndFreeze({ kind: 'suffix', segments });
}

export function createBedrockEndpointMatcher(operation: BedrockEndpointMatcher['operation']): BedrockEndpointMatcher {
	return cloneAndFreeze({ kind: 'bedrock', operation });
}

export function createGoogleEndpointMatcher(
	platform: GoogleEndpointMatcher['platform'],
	operation: GoogleEndpointMatcher['operation'],
): GoogleEndpointMatcher {
	return cloneAndFreeze({ kind: 'google', platform, operation });
}
