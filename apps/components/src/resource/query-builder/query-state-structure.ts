import type { QueryGroup, QueryNode } from './query-model';
import { isQueryJsonValue } from './query-model';

export function normalizeRuntimeMaxDepth(value: unknown, fallback: number) {
	return Number.isInteger(value) && Number(value) >= 0 ? Math.min(Number(value), 64) : fallback;
}

export function isQueryGroupValue(value: unknown, maxDepth = 64): value is QueryGroup {
	return (
		isRecord(value) &&
		value.type === 'group' &&
		isNodeStructurallyValid(value, 0, normalizeRuntimeMaxDepth(maxDepth, 64), new Set(), false, false)
	);
}

export function isQueryNodeValue(value: unknown, maxDepth = 64): value is QueryNode {
	return isNodeStructurallyValid(value, 0, normalizeRuntimeMaxDepth(maxDepth, 64), new Set(), false, false);
}

export function isQueryGroupShape(value: unknown): value is QueryGroup {
	return isRecord(value) && value.type === 'group' && isNodeStructurallyValid(value, 0, 64, new Set(), true, true);
}

export function isNodeStructurallyValid(
	node: unknown,
	depth: number,
	maxDepth: number,
	ids: Set<string>,
	allowDuplicateIds: boolean,
	allowInvalidValues: boolean,
): node is QueryNode {
	const ancestors = new WeakSet<object>();
	const seenNodes = new WeakSet<object>();
	const stack: { value: unknown; depth: number; exiting?: boolean }[] = [{ value: node, depth }];
	while (stack.length) {
		const current = stack.pop() as { value: unknown; depth: number; exiting?: boolean };
		if (current.exiting) {
			ancestors.delete(current.value as object);
			continue;
		}
		if (!isRecord(current.value) || (current.value.type !== 'group' && current.value.type !== 'rule')) return false;
		const currentNode = current.value;
		if (ancestors.has(currentNode) || seenNodes.has(currentNode)) return false;
		seenNodes.add(currentNode);
		if (typeof currentNode.id !== 'string' || !currentNode.id.trim() || (!allowDuplicateIds && ids.has(currentNode.id)))
			return false;
		ids.add(currentNode.id);
		if (currentNode.type === 'rule') {
			if (
				typeof currentNode.field !== 'string' ||
				typeof currentNode.operator !== 'string' ||
				(!allowInvalidValues && !isQueryJsonValue(currentNode.value))
			)
				return false;
			continue;
		}
		if (
			current.depth > maxDepth ||
			(currentNode.combinator !== 'and' && currentNode.combinator !== 'or') ||
			typeof currentNode.negated !== 'boolean' ||
			!Array.isArray(currentNode.children)
		)
			return false;
		ancestors.add(currentNode);
		stack.push({ value: currentNode, depth: current.depth, exiting: true });
		for (let index = currentNode.children.length - 1; index >= 0; index -= 1) {
			if (!(index in currentNode.children)) return false;
			stack.push({ value: currentNode.children[index], depth: current.depth + 1 });
		}
	}
	return true;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
