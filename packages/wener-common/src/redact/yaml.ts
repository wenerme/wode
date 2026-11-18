import { isAlias, isMap, isScalar, isSeq, type Pair, parseDocument, type YAMLMap, type YAMLSeq } from 'yaml';
import type { RedactionContext } from './policy';

interface Replacement {
	start: number;
	end: number;
	value: string;
}

/** Edits scalar ranges, preserving YAML layout and original line endings. */
export function redactYaml(
	source: string,
	context: RedactionContext,
	redactScalar: (value: unknown) => unknown,
): { value: string; structured: boolean } {
	let document: ReturnType<typeof parseDocument>;
	try {
		document = parseDocument(source);
	} catch {
		return { value: source, structured: false };
	}
	// Arbitrary free text is not necessarily valid YAML; still run the line-oriented passes.
	if (document.errors.length || document.warnings.length) return { value: source, structured: false };
	if (!isMap(document.contents) && !isSeq(document.contents)) return { value: source, structured: false };
	const replacements: Replacement[] = [];
	let unsafe = false;
	const marker = yamlScalar(context.policy.marker);
	function comments(node: { comment?: string | null; commentBefore?: string | null }) {
		for (const value of [node.comment, node.commentBefore]) {
			if (typeof value === 'string' && redactScalar(value) !== value) {
				// Comment ranges are not scalar ranges; mask the document rather than risk invalid YAML.
				context.mark();
				unsafe = true;
			}
		}
	}

	function replace(node: unknown, replacement = marker) {
		context.mark();
		if ((!isAlias(node) && !isScalar(node) && !isMap(node) && !isSeq(node)) || isAlias(node)) {
			unsafe = true;
			return;
		}
		// A replaced range may end before a nested scalar's trailing comment.
		// Inspect the entire subtree without following aliases or using the JS call stack.
		const pending: unknown[] = [node];
		while (pending.length) {
			context.spend();
			const current = pending.pop();
			if (!isAlias(current) && !isScalar(current) && !isMap(current) && !isSeq(current)) continue;
			comments(current);
			if (isAlias(current)) {
				unsafe = true;
				continue;
			}
			if (isMap(current)) for (const pair of current.items) pending.push(pair.key, pair.value);
			else if (isSeq(current)) for (const item of current.items) pending.push(item);
		}
		const start = node.range?.[0];
		const end = node.range?.[1];
		if (start === undefined || end === undefined || start < 0 || start >= end || end > source.length) {
			unsafe = true;
			return;
		}
		const ending = source.slice(start, end).match(/(?:\r\n|\n|\r)$/u)?.[0] ?? '';
		replacements.push({ start, end, value: replacement + ending });
	}
	function scalar(node: unknown) {
		if (!isScalar(node)) return;
		comments(node);
		const output = redactScalar(node.value);
		if (output !== node.value) replace(node, typeof output === 'string' ? yamlScalar(output) : JSON.stringify(output));
	}
	function visit(node: YAMLMap<unknown, unknown> | YAMLSeq<unknown>, depth: number) {
		context.spend();
		comments(node);
		if (depth >= context.policy.maxDepth) {
			replace(node);
			return;
		}
		if (isSeq(node)) {
			for (const item of node.items) {
				context.spend();
				if (isMap(item) || isSeq(item)) visit(item, depth + 1);
				else if (isScalar(item) && context.policy.shouldMask(item.value)) replace(item);
				else scalar(item);
			}
			return;
		}
		const pairs = node.items.map((pair) => ({ pair, key: pairKey(pair) }));
		if (pairs.some(({ pair }) => isAlias(pair.key))) {
			context.mark();
			unsafe = true;
			return;
		}
		const itemKey = pairs.find(({ key }) => key === 'key')?.pair.value;
		if (isAlias(itemKey)) {
			context.mark();
			unsafe = true;
			return;
		}
		const itemKeyValue = isScalar(itemKey) ? itemKey.value : undefined;
		const keyAware = typeof itemKeyValue === 'string' && context.policy.keySensitive(itemKeyValue);
		for (const { pair, key } of pairs) {
			context.spend();
			if (isScalar(pair.key)) comments(pair.key);
			const value = isScalar(pair.value) ? pair.value.value : pair.value;
			const valueKey =
				keyAware && key !== undefined && ['value', 'oldValue', 'newValue'].includes(key) ? itemKeyValue : key;
			if (context.policy.shouldMask(value, valueKey)) replace(pair.value);
			else if (isMap(pair.value) || isSeq(pair.value)) visit(pair.value, depth + 1);
			else scalar(pair.value);
		}
	}
	comments(document);
	visit(document.contents, 0);
	if (unsafe) return { value: marker, structured: true };
	let output = source;
	let nextStart = source.length;
	for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
		if (replacement.end > nextStart) {
			context.mark();
			return { value: marker, structured: true };
		}
		output = output.slice(0, replacement.start) + replacement.value + output.slice(replacement.end);
		nextStart = replacement.start;
	}
	return { value: output, structured: true };
}

function yamlScalar(value: string): string {
	const document = parseDocument(value);
	return !document.errors.length &&
		!document.warnings.length &&
		isScalar(document.contents) &&
		document.contents.value === value
		? value
		: JSON.stringify(value);
}

function pairKey(pair: Pair<unknown, unknown>): string | undefined {
	return isScalar(pair.key) && typeof pair.key.value === 'string' ? pair.key.value : undefined;
}
