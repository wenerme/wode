import { parse as parseYaml } from 'yaml';
import { equalApolloJsonValues } from './json-equality';
import type { ApolloConfigFormat } from './schema';

/**
 * One entry of a configuration diff. Shared by `release diff`, `release publish --dry-run` and `patch`, so
 * "what a patch changes" and "what a publish releases" read the same. `key` is the properties key or the
 * document path (`server.otel.enabled`, `models[0].name`), which also drives key-based redaction.
 */
export interface ApolloConfigChange {
	key: string;
	op: 'create' | 'update' | 'delete';
	oldValue?: unknown;
	newValue?: unknown;
	/** Last modifier of the draft item, when known (to spot other people's unpublished edits). */
	modifiedBy?: string;
}

/** Marker entry for a document whose text differs only by comments or formatting. */
export const ApolloFormattingOnlyKey = '(comments/formatting)';

type Configurations = Readonly<Record<string, string>>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function formatApolloConfigPath(path: ReadonlyArray<string | number>): string {
	let out = '';
	for (const segment of path) {
		if (typeof segment === 'number') out += `[${segment}]`;
		else if (/^[\w-]+$/u.test(segment)) out += out ? `.${segment}` : segment;
		else out += `[${JSON.stringify(segment)}]`;
	}
	return out || '(root)';
}

function leaves(
	value: unknown,
	path: Array<string | number>,
	emit: (path: Array<string | number>, value: unknown) => void,
): void {
	if (isPlainObject(value) && Object.keys(value).length) {
		for (const [key, item] of Object.entries(value)) leaves(item, [...path, key], emit);
		return;
	}
	emit(path, value);
}

/** Structured diff by path: maps recurse, equal-length arrays recurse by index, everything else is a leaf. */
export function diffApolloValues(
	base: unknown,
	next: unknown,
	path: Array<string | number> = [],
	changes: ApolloConfigChange[] = [],
): ApolloConfigChange[] {
	if (isPlainObject(base) && isPlainObject(next)) {
		for (const [key, value] of Object.entries(next)) {
			if (Object.hasOwn(base, key)) diffApolloValues(base[key], value, [...path, key], changes);
			else
				leaves(value, [...path, key], (leafPath, leaf) =>
					changes.push({ key: formatApolloConfigPath(leafPath), op: 'create', newValue: leaf }),
				);
		}
		for (const [key, value] of Object.entries(base)) {
			if (Object.hasOwn(next, key)) continue;
			leaves(value, [...path, key], (leafPath, leaf) =>
				changes.push({ key: formatApolloConfigPath(leafPath), op: 'delete', oldValue: leaf }),
			);
		}
		return changes;
	}
	if (Array.isArray(base) && Array.isArray(next) && base.length === next.length) {
		base.forEach((item, index) => {
			diffApolloValues(item, next[index], [...path, index], changes);
		});
		return changes;
	}
	if (!equalApolloJsonValues(base, next)) {
		changes.push({ key: formatApolloConfigPath(path), op: 'update', oldValue: base, newValue: next });
	}
	return changes;
}

export function diffApolloProperties(base: Configurations, next: Configurations): ApolloConfigChange[] {
	const changes: ApolloConfigChange[] = [];
	for (const [key, value] of Object.entries(next)) {
		if (!Object.hasOwn(base, key)) changes.push({ key, op: 'create', newValue: value });
		else if (base[key] !== value) changes.push({ key, op: 'update', oldValue: base[key], newValue: value });
	}
	for (const [key, value] of Object.entries(base)) {
		if (!Object.hasOwn(next, key)) changes.push({ key, op: 'delete', oldValue: value });
	}
	return changes;
}

function parseDocumentText(format: ApolloConfigFormat, text: string): { ok: true; value: unknown } | { ok: false } {
	if (!text.trim()) return { ok: true, value: {} };
	try {
		return { ok: true, value: format === 'json' ? JSON.parse(text) : (parseYaml(text) ?? {}) };
	} catch {
		return { ok: false };
	}
}

/**
 * Diffs two Apollo configuration maps (release `configurations` or draft items). Properties diff by key; YAML
 * and JSON namespaces (single `content` item) diff structurally by path; other text formats compare content.
 */
export function diffApolloConfigurations(
	format: ApolloConfigFormat,
	base: Configurations,
	next: Configurations,
): ApolloConfigChange[] {
	if (format === 'properties') return diffApolloProperties(base, next);
	const baseText = base.content ?? '';
	const nextText = next.content ?? '';
	if (baseText === nextText) return [];
	if (format === 'yaml' || format === 'yml' || format === 'json') {
		const left = parseDocumentText(format, baseText);
		const right = parseDocumentText(format, nextText);
		if (left.ok && right.ok) {
			const changes = diffApolloValues(left.value, right.value);
			return changes.length ? changes : [{ key: ApolloFormattingOnlyKey, op: 'update' }];
		}
	}
	return [{ key: 'content', op: 'update', oldValue: baseText, newValue: nextText }];
}
