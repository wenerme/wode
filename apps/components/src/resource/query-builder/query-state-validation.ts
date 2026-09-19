import type {
	QueryField,
	QueryGroup,
	QueryJsonPrimitive,
	QueryJsonValue,
	QueryOperator,
	QueryRule,
} from './query-model';
import { defaultQueryOperators, getOperatorsForField, getQueryOperatorMap, isQueryJsonValue } from './query-model';
import { isQueryGroupShape, isRecord, normalizeRuntimeMaxDepth } from './query-state-structure';
import { walkQuery } from './query-state-traversal';

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
