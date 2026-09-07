import type { QueryGroup, QueryJsonValue, QueryNode, QueryRule } from './query-model';
import { cloneQueryJsonValue, isQueryJsonValue } from './query-model';
import {
	areQueriesEqual,
	cloneNodePreservingIds,
	getQueryNodeLocation,
	valuesEqual,
	walkQuery,
} from './query-state-traversal';
import { isNodeStructurallyValid, isQueryGroupValue, normalizeRuntimeMaxDepth } from './query-state-structure';

export type QueryAction =
	| { type: 'insert-node'; parentId: string; node: QueryNode; index?: number }
	| { type: 'update-rule'; id: string; patch: Partial<Pick<QueryRule, 'field' | 'operator' | 'value'>> }
	| { type: 'update-group'; id: string; patch: Partial<Pick<QueryGroup, 'combinator' | 'negated'>> }
	| { type: 'remove-node'; id: string }
	| { type: 'move-node'; id: string; direction: 'up' | 'down' }
	| { type: 'clear-group'; id: string }
	| { type: 'replace-query'; query: QueryGroup };

export type QueryReducerOptions = {
	maxDepth?: number;
};

export function reduceQuery(query: QueryGroup, action: QueryAction, options: QueryReducerOptions = {}): QueryGroup {
	if (!isQueryGroupValue(query) || !isRecord(action) || typeof action.type !== 'string') return query;
	const maxDepth = normalizeRuntimeMaxDepth(options.maxDepth, 4);
	switch (action.type) {
		case 'replace-query':
			if (!isQueryGroupValue(action.query, maxDepth) || areQueriesEqual(query, action.query)) return query;
			return cloneNodePreservingIds(action.query) as QueryGroup;
		case 'insert-node': {
			if (typeof action.parentId !== 'string' || (action.index !== undefined && !Number.isInteger(action.index)))
				return query;
			const parent = getQueryNodeLocation(query, action.parentId);
			if (
				!parent ||
				parent.node.type !== 'group' ||
				!isNodeStructurallyValid(action.node, parent.depth + 1, maxDepth, new Set(), false, false) ||
				hasIdIntersection(query, action.node)
			)
				return query;
			const index = Math.max(0, Math.min(action.index ?? parent.node.children.length, parent.node.children.length));
			const node = cloneNodePreservingIds(action.node);
			return updateGroup(query, action.parentId, (group) => ({
				...group,
				children: [...group.children.slice(0, index), node, ...group.children.slice(index)],
			}));
		}
		case 'update-rule': {
			if (typeof action.id !== 'string' || !isRecord(action.patch)) return query;
			if (Object.hasOwn(action.patch, 'field') && typeof action.patch.field !== 'string') return query;
			if (Object.hasOwn(action.patch, 'operator') && typeof action.patch.operator !== 'string') return query;
			if (Object.hasOwn(action.patch, 'value') && !isQueryJsonValue(action.patch.value)) return query;
			return updateNode(query, action.id, (node) => {
				if (node.type !== 'rule') return node;
				const field = action.patch.field ?? node.field;
				const operator = action.patch.operator ?? node.operator;
				const value = Object.hasOwn(action.patch, 'value')
					? cloneQueryJsonValue(action.patch.value as QueryJsonValue)
					: node.value;
				if (field === node.field && operator === node.operator && valuesEqual(value, node.value)) return node;
				return { ...node, field, operator, value };
			});
		}
		case 'update-group':
			if (typeof action.id !== 'string' || !isRecord(action.patch)) return query;
			if (
				(Object.hasOwn(action.patch, 'combinator') &&
					action.patch.combinator !== 'and' &&
					action.patch.combinator !== 'or') ||
				(Object.hasOwn(action.patch, 'negated') && typeof action.patch.negated !== 'boolean')
			)
				return query;
			return updateGroup(query, action.id, (group) => {
				const combinator = action.patch.combinator ?? group.combinator;
				const negated = action.patch.negated ?? group.negated;
				return combinator === group.combinator && negated === group.negated ? group : { ...group, combinator, negated };
			});
		case 'remove-node':
			if (typeof action.id !== 'string') return query;
			return action.id === query.id ? query : removeNode(query, action.id);
		case 'clear-group':
			if (typeof action.id !== 'string') return query;
			return updateGroup(query, action.id, (group) => (group.children.length ? { ...group, children: [] } : group));
		case 'move-node':
			if (typeof action.id !== 'string' || (action.direction !== 'up' && action.direction !== 'down')) return query;
			return moveSibling(query, action.id, action.direction);
		default:
			return query;
	}
}

function updateNode(query: QueryGroup, id: string, updater: (node: QueryNode) => QueryNode): QueryGroup {
	if (query.id === id) {
		const updated = updater(query);
		return updated.type === 'group' ? updated : query;
	}
	let changed = false;
	const children = query.children.map((child) => {
		if (child.id === id) {
			const updated = updater(child);
			changed ||= updated !== child;
			return updated;
		}
		if (child.type === 'group') {
			const updated = updateNode(child, id, updater);
			changed ||= updated !== child;
			return updated;
		}
		return child;
	});
	return changed ? { ...query, children } : query;
}

function updateGroup(query: QueryGroup, id: string, updater: (group: QueryGroup) => QueryGroup) {
	return updateNode(query, id, (node) => (node.type === 'group' ? updater(node) : node));
}

function removeNode(query: QueryGroup, id: string): QueryGroup {
	let changed = false;
	const children: QueryNode[] = [];
	for (const child of query.children) {
		if (child.id === id) {
			changed = true;
			continue;
		}
		if (child.type === 'group') {
			const updated = removeNode(child, id);
			changed ||= updated !== child;
			children.push(updated);
		} else children.push(child);
	}
	return changed ? { ...query, children } : query;
}

function moveSibling(query: QueryGroup, id: string, direction: 'up' | 'down'): QueryGroup {
	const index = query.children.findIndex((child) => child.id === id);
	if (index >= 0) {
		const target = direction === 'up' ? index - 1 : index + 1;
		if (target < 0 || target >= query.children.length) return query;
		const children = [...query.children];
		[children[index], children[target]] = [children[target], children[index]];
		return { ...query, children };
	}
	let changed = false;
	const children = query.children.map((child) => {
		if (child.type !== 'group') return child;
		const updated = moveSibling(child, id, direction);
		changed ||= updated !== child;
		return updated;
	});
	return changed ? { ...query, children } : query;
}

function hasIdIntersection(query: QueryGroup, candidate: QueryNode) {
	const existing = new Set<string>();
	walkQuery(query, ({ node }) => existing.add(node.id));
	let conflict = false;
	const candidateIds = new Set<string>();
	const stack = [candidate];
	while (stack.length) {
		const node = stack.pop() as QueryNode;
		if (typeof node.id !== 'string' || !node.id.trim() || existing.has(node.id) || candidateIds.has(node.id))
			conflict = true;
		candidateIds.add(node.id);
		if (node.type === 'group') stack.push(...node.children);
	}
	return conflict;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

export * from './query-state-structure';
export * from './query-state-traversal';
export * from './query-state-validation';
