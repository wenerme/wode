import type {
	QueryField,
	QueryGroup,
	QueryIdFactory,
	QueryJsonPrimitive,
	QueryJsonValue,
	QueryNode,
	QueryOperator,
	QueryRule,
} from './query-model';
import {
	cloneQueryJsonValue,
	defaultQueryOperators,
	getOperatorsForField,
	getQueryOperatorMap,
	isQueryJsonValue,
} from './query-model';

export type QueryNodeLocation = {
	node: QueryNode;
	parent: QueryGroup | null;
	index: number;
	depth: number;
	path: number[];
};

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

export type QueryValidationIssueCode =
	| 'invalid-query'
	| 'duplicate-id'
	| 'max-depth'
	| 'unknown-field'
	| 'unknown-operator'
	| 'operator-not-allowed'
	| 'invalid-cardinality'
	| 'missing-value'
	| 'invalid-value';

export type QueryValidationIssue = {
	code: QueryValidationIssueCode;
	nodeId: string;
	path: number[];
	message: string;
};

export type ValidateQueryOptions = {
	fields: readonly QueryField[];
	operators?: readonly QueryOperator[];
	maxDepth?: number;
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

function cloneNodePreservingIds(node: QueryNode): QueryNode {
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

function valuesEqual(
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

export function reduceQuery(query: QueryGroup, action: QueryAction, options: QueryReducerOptions = {}): QueryGroup {
	if (!isQueryGroupValue(query) || !isRecord(action) || typeof action.type !== 'string') return query;
	const maxDepth = normalizeRuntimeMaxDepth(options.maxDepth, 4);
	switch (action.type) {
		case 'replace-query':
			if (!isQueryGroupValue(action.query, maxDepth) || areQueriesEqual(query, action.query)) return query;
			return cloneQuery(action.query);
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
		} else {
			children.push(child);
		}
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
	function visit(node: QueryNode) {
		if (typeof node.id !== 'string' || !node.id.trim() || existing.has(node.id) || candidateIds.has(node.id))
			conflict = true;
		candidateIds.add(node.id);
		if (node.type === 'group') node.children.forEach(visit);
	}
	visit(candidate);
	return conflict;
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

function normalizeRuntimeMaxDepth(value: unknown, fallback: number) {
	return Number.isInteger(value) && Number(value) >= 0 ? Math.min(Number(value), 64) : fallback;
}

function isQueryGroupShape(value: unknown): value is QueryGroup {
	return isRecord(value) && value.type === 'group' && isNodeStructurallyValid(value, 0, 64, new Set(), true, true);
}

function isNodeStructurallyValid(
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

function isRecord(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

export function validateQuery(query: QueryGroup, options: ValidateQueryOptions): QueryValidationIssue[] {
	const runtimeQuery: unknown = query;
	if (!isQueryGroupShape(runtimeQuery)) {
		const nodeId = isRecord(runtimeQuery) && typeof runtimeQuery.id === 'string' ? runtimeQuery.id : 'query-root';
		return [issue('invalid-query', nodeId, [], '查询条件结构无效。')];
	}
	const fields = new Map(options.fields.map((field) => [field.name, field]));
	const operators = options.operators ?? defaultQueryOperators;
	const operatorMap = getQueryOperatorMap(operators);
	const maxDepth = normalizeRuntimeMaxDepth(options.maxDepth, 4);
	const issues: QueryValidationIssue[] = [];
	const ids = new Set<string>();
	walkQuery(query, ({ node, depth, path }) => {
		if (ids.has(node.id)) issues.push(issue('duplicate-id', node.id, path, '节点 ID 必须唯一。'));
		ids.add(node.id);
		if (node.type === 'group') {
			if (depth > maxDepth) issues.push(issue('max-depth', node.id, path, `分组最多可嵌套 ${maxDepth} 层。`));
			return;
		}
		const field = fields.get(node.field);
		if (!field) {
			issues.push(issue('unknown-field', node.id, path, '请选择可用字段。'));
			return;
		}
		const operator = operatorMap.get(node.operator);
		if (!operator) {
			issues.push(issue('unknown-operator', node.id, path, '请选择可用操作符。'));
			return;
		}
		if (!getOperatorsForField(field, operators).some((candidate) => candidate.name === operator.name)) {
			issues.push(issue('operator-not-allowed', node.id, path, '当前字段不支持此操作符。'));
			return;
		}
		validateRuleValue(node, field, operator, path, issues);
	});
	return issues;
}

function validateRuleValue(
	rule: QueryRule,
	field: QueryField,
	operator: QueryOperator,
	path: number[],
	issues: QueryValidationIssue[],
) {
	if (!isQueryJsonValue(rule.value)) {
		issues.push(issue('invalid-value', rule.id, path, '值必须可序列化为 JSON。'));
		return;
	}
	if (operator.cardinality === 'none') {
		if (rule.value !== null) issues.push(issue('invalid-cardinality', rule.id, path, '此操作符无需填写值。'));
		return;
	}
	if (operator.cardinality === 'pair') {
		if (!Array.isArray(rule.value) || rule.value.length !== 2) {
			issues.push(issue('invalid-cardinality', rule.id, path, '此操作符需要两个值。'));
			return;
		}
		if (rule.value.some(isMissing)) issues.push(issue('missing-value', rule.id, path, '请填写完整的范围值。'));
		else if (rule.value.some((value) => !isValidScalar(field, value))) {
			issues.push(issue('invalid-value', rule.id, path, '一个或多个范围值无效。'));
		}
		return;
	}
	if (operator.cardinality === 'many') {
		if (!Array.isArray(rule.value)) {
			issues.push(issue('invalid-cardinality', rule.id, path, '此操作符需要一个值列表。'));
			return;
		}
		if (rule.value.length === 0) issues.push(issue('missing-value', rule.id, path, '请至少添加一个值。'));
		else if (rule.value.some((value) => !isValidScalar(field, value))) {
			issues.push(issue('invalid-value', rule.id, path, '一个或多个列表值无效。'));
		}
		return;
	}
	if (Array.isArray(rule.value) || isMissing(rule.value)) {
		issues.push(issue('missing-value', rule.id, path, '请输入值。'));
	} else if (!isValidScalar(field, rule.value)) {
		issues.push(issue('invalid-value', rule.id, path, '该值与所选字段类型不匹配。'));
	}
}

function isMissing(value: QueryJsonValue) {
	return value === null || (typeof value === 'string' && value.trim().length === 0);
}

function isValidScalar(field: QueryField, value: QueryJsonValue) {
	if (value === null || Array.isArray(value) || typeof value === 'object') return false;
	const kind = field.kind === 'array' ? (field.itemKind ?? 'unknown') : field.kind;
	if (kind === 'number' || kind === 'integer')
		return typeof value === 'number' && Number.isFinite(value) && (kind !== 'integer' || Number.isInteger(value));
	if (kind === 'boolean') return typeof value === 'boolean';
	if (kind === 'date') return typeof value === 'string' && isValidDate(value);
	if (kind === 'datetime') return typeof value === 'string' && isValidDateTime(value);
	if (kind === 'string') return typeof value === 'string';
	if (kind === 'enum' && field.options)
		return field.options.some((option) => Object.is(option.value, value as QueryJsonPrimitive));
	return true;
}

function isValidDate(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return false;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(0);
	date.setUTCFullYear(year, month - 1, day);
	date.setUTCHours(0, 0, 0, 0);
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidDateTime(value: string) {
	const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
	if (!match || !isValidDate(match[1])) return false;
	const hours = Number(match[2]);
	const minutes = Number(match[3]);
	const seconds = match[4] === undefined ? 0 : Number(match[4]);
	const offsetHours = match[7] === undefined ? 0 : Number(match[7]);
	const offsetMinutes = match[8] === undefined ? 0 : Number(match[8]);
	return (
		hours < 24 &&
		minutes < 60 &&
		seconds < 60 &&
		offsetHours < 24 &&
		offsetMinutes < 60 &&
		Number.isFinite(Date.parse(value))
	);
}

function issue(code: QueryValidationIssueCode, nodeId: string, path: number[], message: string): QueryValidationIssue {
	return { code, nodeId, path, message };
}
