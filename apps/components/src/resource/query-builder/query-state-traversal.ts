import type { QueryGroup, QueryIdFactory, QueryJsonValue, QueryNode } from './query-model';
import { cloneQueryJsonValue } from './query-model';
import { isQueryGroupValue, isQueryNodeValue, isRecord } from './query-state-structure';

export type QueryNodeLocation = {
	node: QueryNode;
	parent: QueryGroup | null;
	index: number;
	depth: number;
	path: number[];
};

export function walkQuery(query: QueryGroup, visitor: (location: QueryNodeLocation) => void) {
	const stack: QueryNodeLocation[] = [{ node: query, parent: null, index: -1, depth: 0, path: [] }];
	const seen = new WeakSet<object>();
	while (stack.length) {
		const location = stack.pop() as QueryNodeLocation;
		const runtimeNode: unknown = location.node;
		if (
			location.depth > 64 ||
			!isRecord(runtimeNode) ||
			(runtimeNode.type !== 'group' && runtimeNode.type !== 'rule') ||
			typeof runtimeNode.id !== 'string' ||
			seen.has(runtimeNode)
		)
			continue;
		if (runtimeNode.type === 'group' && !Array.isArray(runtimeNode.children)) continue;
		seen.add(runtimeNode);
		visitor(location);
		if (location.node.type !== 'group') continue;
		for (let index = location.node.children.length - 1; index >= 0; index -= 1) {
			if (!(index in location.node.children)) continue;
			stack.push({
				node: location.node.children[index],
				parent: location.node,
				index,
				depth: location.depth + 1,
				path: [...location.path, index],
			});
		}
	}
}

export function getQueryNodeLocation(query: QueryGroup, id: string) {
	let found: QueryNodeLocation | undefined;
	walkQuery(query, (location) => {
		if (!found && location.node.id === id) found = location;
	});
	return found;
}

export function findQueryNode(query: QueryGroup, id: string) {
	return getQueryNodeLocation(query, id)?.node;
}

export function countQueryRules(node: QueryNode): number {
	const runtimeNode: unknown = node;
	if (!isRecord(runtimeNode) || (runtimeNode.type !== 'rule' && runtimeNode.type !== 'group')) return 0;
	if (runtimeNode.type === 'rule') return isQueryNodeValue(runtimeNode) ? 1 : 0;
	let count = 0;
	walkQuery(runtimeNode as QueryGroup, ({ node: current }) => {
		if (current.type === 'rule') count += 1;
	});
	return count;
}

export function getQueryDepth(node: QueryNode): number {
	const runtimeNode: unknown = node;
	if (!isRecord(runtimeNode) || runtimeNode.type !== 'group') return 0;
	let maxDepth = 0;
	walkQuery(runtimeNode as QueryGroup, ({ node: current, depth }) => {
		if (current.type === 'group') maxDepth = Math.max(maxDepth, depth);
	});
	return maxDepth;
}

export function cloneQueryNode(node: QueryNode, createId: QueryIdFactory): QueryNode {
	if (!isQueryNodeValue(node)) throw new TypeError('Cannot clone an invalid runtime query node.');
	return cloneQueryNodeUnchecked(node, createId);
}

function cloneQueryNodeUnchecked(node: QueryNode, createId: QueryIdFactory): QueryNode {
	if (node.type === 'rule') {
		return { ...node, id: createId('rule'), value: cloneQueryJsonValue(node.value) };
	}
	return {
		...node,
		id: createId('group'),
		children: node.children.map((child) => cloneQueryNodeUnchecked(child, createId)),
	};
}

export function cloneQuery(query: QueryGroup) {
	if (!isQueryGroupValue(query)) throw new TypeError('Cannot clone an invalid runtime query document.');
	return cloneNodePreservingIds(query) as QueryGroup;
}

export function cloneNodePreservingIds(node: QueryNode): QueryNode {
	return node.type === 'rule'
		? { ...node, value: cloneQueryJsonValue(node.value) }
		: { ...node, children: node.children.map(cloneNodePreservingIds) };
}

export function areQueriesEqual(left: QueryNode, right: QueryNode): boolean {
	if (!isQueryNodeValue(left) || !isQueryNodeValue(right)) return false;
	return areQueryNodesEqualUnchecked(left, right, { pairs: new WeakMap(), remaining: 100_000 });
}

type EqualityState = { pairs: WeakMap<object, WeakSet<object>>; remaining: number };

function rememberPair(left: object, right: object, state: EqualityState) {
	const rights = state.pairs.get(left);
	if (rights?.has(right)) return true;
	if (rights) rights.add(right);
	else state.pairs.set(left, new WeakSet([right]));
	return false;
}

function areQueryNodesEqualUnchecked(left: QueryNode, right: QueryNode, state: EqualityState): boolean {
	state.remaining -= 1;
	if (state.remaining < 0) return false;
	if (rememberPair(left, right, state)) return true;
	if (left.type !== right.type || left.id !== right.id) return false;
	if (left.type === 'rule' && right.type === 'rule') {
		return (
			left.field === right.field && left.operator === right.operator && valuesEqual(left.value, right.value, state)
		);
	}
	if (left.type === 'group' && right.type === 'group') {
		return (
			left.combinator === right.combinator &&
			left.negated === right.negated &&
			left.children.length === right.children.length &&
			left.children.every((child, index) => areQueryNodesEqualUnchecked(child, right.children[index], state))
		);
	}
	return false;
}

export function valuesEqual(
	left: QueryJsonValue,
	right: QueryJsonValue,
	state: EqualityState = { pairs: new WeakMap(), remaining: 100_000 },
): boolean {
	state.remaining -= 1;
	if (state.remaining < 0) return false;
	if (Object.is(left, right)) return true;
	if (Array.isArray(left) && Array.isArray(right)) {
		if (rememberPair(left, right, state)) return true;
		return left.length === right.length && left.every((item, index) => valuesEqual(item, right[index], state));
	}
	if (
		left &&
		right &&
		typeof left === 'object' &&
		typeof right === 'object' &&
		!Array.isArray(left) &&
		!Array.isArray(right)
	) {
		if (rememberPair(left, right, state)) return true;
		const leftKeys = Object.keys(left);
		const rightKeys = Object.keys(right);
		return (
			leftKeys.length === rightKeys.length &&
			leftKeys.every((key) => Object.hasOwn(right, key) && valuesEqual(left[key], right[key], state))
		);
	}
	return false;
}
