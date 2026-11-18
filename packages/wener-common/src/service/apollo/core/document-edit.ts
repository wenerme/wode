import { parseObjectPath } from '@wener/utils';
import { Document, isCollection, isMap, isNode, isScalar, parseDocument, type ToStringOptions } from 'yaml';
import { equalApolloJsonValues } from './json-equality';

export type ApolloDocumentFormat = 'yaml' | 'yml' | 'json';

export interface ApolloDocumentSet {
	path: string;
	value: unknown;
}

export interface ApolloDocumentEditInput {
	format: ApolloDocumentFormat;
	text: string;
	set?: readonly ApolloDocumentSet[];
	merge?: readonly Record<string, unknown>[];
	delete?: readonly string[];
}

/** Shares the `{ key, oldValue, newValue }` shape with item patches so output redaction applies by path. */
export interface ApolloDocumentChange {
	key: string;
	op: 'create' | 'update' | 'delete';
	oldValue?: unknown;
	newValue?: unknown;
	changed: 'yes' | '';
}

export interface ApolloDocumentEditResult {
	text: string;
	changes: ApolloDocumentChange[];
	/** Re-serializing the untouched document already differs from the source (comment indent, blank lines). */
	reformatted: boolean;
}

const UnsafeSegments = new Set(['__proto__', 'constructor', 'prototype']);
type Path = string[];

export function isApolloDocumentFormat(format: string | undefined): format is ApolloDocumentFormat {
	return format === 'yaml' || format === 'yml' || format === 'json';
}

export function parseApolloDocumentPath(path: string): Path {
	const segments = parseObjectPath(path.trim()).map(String);
	if (!segments.length || segments.some((segment) => !segment.trim())) {
		throw new Error(`invalid document path: ${path}`);
	}
	if (segments.some((segment) => UnsafeSegments.has(segment))) throw new Error(`unsafe document path: ${path}`);
	return segments;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toJs(value: unknown): unknown {
	return isNode(value) ? value.toJSON() : value;
}

function label(path: Path): string {
	return path.join('.');
}

function ensureParentMap(doc: Document, path: Path): void {
	if (doc.contents !== null && !isCollection(doc.contents)) throw new Error('document root is not a map');
	for (let index = 1; index < path.length; index++) {
		const prefix = path.slice(0, index);
		if (!doc.hasIn(prefix)) return;
		const node = doc.getIn(prefix, true);
		if (isCollection(node)) continue;
		if (isScalar(node) && node.value == null) {
			doc.setIn(prefix, doc.createNode({}));
			return;
		}
		throw new Error(`cannot set ${label(path)}: ${label(prefix)} is a scalar value, not a map`);
	}
}

function setLeaf(doc: Document, path: Path, value: unknown, changes: ApolloDocumentChange[]): void {
	const key = label(path);
	const exists = doc.hasIn(path);
	const oldValue = exists ? toJs(doc.getIn(path)) : undefined;
	if (exists && equalApolloJsonValues(oldValue, value)) {
		changes.push({ key, op: 'update', oldValue, newValue: value, changed: '' });
		return;
	}
	ensureParentMap(doc, path);
	doc.setIn(path, value !== null && typeof value === 'object' ? doc.createNode(value) : value);
	changes.push({ key, op: exists ? 'update' : 'create', oldValue, newValue: value, changed: 'yes' });
}

function mergeInto(doc: Document, prefix: Path, fragment: Record<string, unknown>, changes: ApolloDocumentChange[]) {
	for (const [key, value] of Object.entries(fragment)) {
		if (UnsafeSegments.has(key)) throw new Error(`unsafe document key: ${key}`);
		const path = [...prefix, key];
		if (isPlainObject(value) && Object.keys(value).length) {
			const existing = doc.hasIn(path) ? doc.getIn(path, true) : undefined;
			if (existing === undefined || isMap(existing) || (isScalar(existing) && existing.value == null)) {
				mergeInto(doc, path, value, changes);
				continue;
			}
		}
		setLeaf(doc, path, value, changes);
	}
}

function deletePath(doc: Document, path: Path, changes: ApolloDocumentChange[]): void {
	const key = label(path);
	if (!doc.hasIn(path)) {
		changes.push({ key, op: 'delete', changed: '' });
		return;
	}
	const oldValue = toJs(doc.getIn(path));
	doc.deleteIn(path);
	changes.push({ key, op: 'delete', oldValue, changed: 'yes' });
}

function detectYamlIndent(text: string): number {
	const match = /^( +)[^\s#-]/mu.exec(text);
	return match?.[1] ? Math.min(match[1].length, 8) : 2;
}

/** `true` when block sequences are indented under their parent key (yaml default). */
function detectYamlIndentSeq(text: string): boolean {
	const lines = text.split('\n');
	for (let index = 0; index < lines.length; index++) {
		const keyLine = /^(\s*)[^\s#-][^#]*:\s*(#.*)?$/u.exec(lines[index] ?? '');
		if (!keyLine) continue;
		const next = lines.slice(index + 1).find((line) => line.trim() && !line.trim().startsWith('#'));
		const item = next ? /^(\s*)- /u.exec(next) : null;
		if (item) return (item[1]?.length ?? 0) > (keyLine[1]?.length ?? 0);
	}
	return true;
}

function detectJsonIndent(text: string): string | number | undefined {
	const match = /^([ \t]+)"/mu.exec(text);
	if (match?.[1]) return match[1].includes('\t') ? '\t' : match[1].length;
	return text.trim().includes('\n') ? 2 : undefined;
}

function parseSource(format: ApolloDocumentFormat, text: string): Document {
	if (format === 'json') {
		let value: unknown;
		try {
			value = text.trim() ? JSON.parse(text) : {};
		} catch {
			throw new Error('current namespace content is not valid JSON; fix it with apollo write first');
		}
		return new Document(value);
	}
	const doc = parseDocument(text);
	if (doc.errors.length) throw new Error('current namespace content is not valid YAML; fix it with apollo write first');
	return doc;
}

function serialize(format: ApolloDocumentFormat, doc: Document, source: string): string {
	if (format === 'json') {
		const text = JSON.stringify(doc.toJS() ?? {}, null, detectJsonIndent(source));
		return source.endsWith('\n') ? `${text}\n` : text;
	}
	const options: ToStringOptions = {
		indent: detectYamlIndent(source),
		indentSeq: detectYamlIndentSeq(source),
		lineWidth: 0,
	};
	return doc.contents === null ? '' : doc.toString(options);
}

/**
 * Applies `merge` fragments (deep, fragment wins), then `set` paths, then `delete` paths to a YAML/JSON document.
 * YAML comments, key order and scalar styles are kept by editing the parsed document instead of plain objects.
 */
export function editApolloDocument(input: ApolloDocumentEditInput): ApolloDocumentEditResult {
	const doc = parseSource(input.format, input.text);
	// An empty or explicit `null` document is treated as an empty map so paths can be created under it.
	if (isScalar(doc.contents) && doc.contents.value == null) doc.contents = doc.createNode({});
	const changes: ApolloDocumentChange[] = [];
	for (const fragment of input.merge ?? []) {
		if (!isPlainObject(fragment)) throw new Error('merge fragment must be a map/object');
		mergeInto(doc, [], fragment, changes);
	}
	for (const item of input.set ?? []) setLeaf(doc, parseApolloDocumentPath(item.path), item.value, changes);
	for (const path of input.delete ?? []) deletePath(doc, parseApolloDocumentPath(path), changes);
	const untouched = serialize(input.format, parseSource(input.format, input.text), input.text);
	const text = changes.some((change) => change.changed) ? serialize(input.format, doc, input.text) : input.text;
	return { text, changes, reformatted: untouched !== input.text };
}
