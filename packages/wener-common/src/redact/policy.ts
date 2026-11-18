import { clamp } from '@wener/utils';
import { isSensitiveKey, normalizeKey } from './keys';
import type { RedactorOptions } from './types';

export const DefaultMarker = '<redacted>';

export function createPolicy(options: RedactorOptions = {}) {
	const marker = options.marker ?? DefaultMarker;
	const secrets = [...(options.knownSecrets ?? [])].filter(Boolean).sort((a, b) => b.length - a.length);
	const patterns = (options.patterns ?? []).map((pattern) => new RegExp(pattern.source, pattern.flags));
	const keys = (options.sensitiveKeys ?? []).map((key) =>
		typeof key === 'string' ? normalizeKey(key) : new RegExp(key.source, key.flags),
	);
	const rules = [...(options.rules ?? [])];
	const keySensitive = (key: string) =>
		isSensitiveKey(key) ||
		keys.some((rule) =>
			typeof rule === 'string' ? normalizeKey(key) === rule : new RegExp(rule.source, rule.flags).test(key),
		);
	return Object.freeze({
		marker,
		maxDepth: resolveLimit(options.maxDepth, 64, 256),
		maxNodes: resolveLimit(options.maxNodes, 10_000),
		maxTextLength: resolveLimit(options.maxTextLength, 1_000_000),
		keySensitive,
		/** Whole-value masking by context; text content is also inspected by the text pipeline. */
		shouldMask(value: unknown, key?: string) {
			if (!hasRedactableValue(value)) return false;
			return (key !== undefined && keySensitive(key)) || rules.some((rule) => rule(value, key));
		},
		literals(value: string, mark: () => void): string {
			let output = value;
			for (const secret of secrets) {
				if (output.includes(secret)) {
					mark();
					output = output.split(secret).join(marker);
				}
			}
			for (const pattern of patterns)
				output = output.replace(
					new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`),
					() => {
						mark();
						return marker;
					},
				);
			return output;
		},
	});
}

/** Nullish and blank strings carry no credential payload; zero and false remain meaningful values. */
export function hasRedactableValue(value: unknown): boolean {
	return value != null && (typeof value !== 'string' || value.trim().length > 0);
}

function resolveLimit(value: number | undefined, fallback: number, ceiling = Number.MAX_SAFE_INTEGER): number {
	if (value !== undefined && (!Number.isSafeInteger(value) || value < 1))
		throw new RangeError('Redaction limits must be positive safe integers');
	return clamp(value, 1, ceiling, fallback);
}

export type RedactionPolicy = ReturnType<typeof createPolicy>;
export interface RedactionContext {
	policy: RedactionPolicy;
	hits: number;
	mark(): void;
	spend(): void;
}
