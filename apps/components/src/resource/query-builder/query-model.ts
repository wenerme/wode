export type QueryJsonPrimitive = string | number | boolean | null;
export type QueryJsonValue = QueryJsonPrimitive | QueryJsonValue[] | { [key: string]: QueryJsonValue };

export type QueryCombinator = 'and' | 'or';
export type QueryFieldKind =
	| 'string'
	| 'number'
	| 'integer'
	| 'boolean'
	| 'date'
	| 'datetime'
	| 'enum'
	| 'array'
	| 'unknown';
export type QueryOperatorCardinality = 'none' | 'single' | 'pair' | 'many';

export type QueryOption = {
	value: QueryJsonPrimitive;
	label: string;
	disabled?: boolean;
};

export type QueryField = {
	name: string;
	label: string;
	description?: string;
	kind: QueryFieldKind;
	group?: string;
	required?: boolean;
	operators?: readonly string[];
	defaultOperator?: string;
	defaultValue?: QueryJsonValue;
	options?: readonly QueryOption[];
	itemKind?: QueryFieldKind;
	editor?: string;
	placeholder?: string;
	meta?: Record<string, QueryJsonValue>;
};

export type QueryOperator = {
	name: string;
	label: string;
	cardinality: QueryOperatorCardinality;
	kinds?: readonly QueryFieldKind[];
	editor?: string;
};

export type QueryRule = {
	type: 'rule';
	id: string;
	field: string;
	operator: string;
	value: QueryJsonValue;
};

export type QueryGroup = {
	type: 'group';
	id: string;
	combinator: QueryCombinator;
	negated: boolean;
	children: QueryNode[];
};

export type QueryNode = QueryGroup | QueryRule;
export type QueryIdFactory = (kind: QueryNode['type']) => string;

export const defaultQueryOperators = [
	{ name: 'eq', label: '等于', cardinality: 'single' },
	{ name: 'ne', label: '不等于', cardinality: 'single' },
	{ name: 'contains', label: '包含', cardinality: 'single', kinds: ['string', 'array'] },
	{ name: 'notContains', label: '不包含', cardinality: 'single', kinds: ['string', 'array'] },
	{ name: 'startsWith', label: '开头为', cardinality: 'single', kinds: ['string'] },
	{ name: 'endsWith', label: '结尾为', cardinality: 'single', kinds: ['string'] },
	{ name: 'gt', label: '大于', cardinality: 'single', kinds: ['number', 'integer', 'date', 'datetime'] },
	{ name: 'gte', label: '大于等于', cardinality: 'single', kinds: ['number', 'integer', 'date', 'datetime'] },
	{ name: 'lt', label: '小于', cardinality: 'single', kinds: ['number', 'integer', 'date', 'datetime'] },
	{ name: 'lte', label: '小于等于', cardinality: 'single', kinds: ['number', 'integer', 'date', 'datetime'] },
	{ name: 'between', label: '介于', cardinality: 'pair', kinds: ['number', 'integer', 'date', 'datetime'] },
	{ name: 'in', label: '属于任一', cardinality: 'many' },
	{ name: 'notIn', label: '不属于任一', cardinality: 'many' },
	{ name: 'containsAny', label: '包含任一', cardinality: 'many', kinds: ['array'] },
	{ name: 'containsAll', label: '包含全部', cardinality: 'many', kinds: ['array'] },
	{ name: 'isNull', label: '为空', cardinality: 'none' },
	{ name: 'isNotNull', label: '不为空', cardinality: 'none' },
] as const satisfies readonly QueryOperator[];

const defaultOperatorsByKind: Record<QueryFieldKind, readonly string[]> = {
	string: ['eq', 'ne', 'contains', 'notContains', 'startsWith', 'endsWith', 'in', 'notIn', 'isNull', 'isNotNull'],
	number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull'],
	integer: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull'],
	boolean: ['eq', 'ne', 'isNull', 'isNotNull'],
	date: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
	datetime: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
	enum: ['eq', 'ne', 'in', 'notIn', 'isNull', 'isNotNull'],
	array: ['contains', 'notContains', 'containsAny', 'containsAll', 'isNull', 'isNotNull'],
	unknown: ['eq', 'ne', 'isNull', 'isNotNull'],
};

let fallbackId = 0;

export function createQueryId(kind: QueryNode['type'] = 'rule') {
	if (typeof globalThis.crypto?.randomUUID === 'function') return `${kind}-${globalThis.crypto.randomUUID()}`;
	fallbackId += 1;
	return `${kind}-${Date.now().toString(36)}-${fallbackId.toString(36)}`;
}

export function createQueryIdFactory(prefix = 'query'): QueryIdFactory {
	let sequence = 0;
	return (kind) => {
		sequence += 1;
		return `${prefix}-${kind}-${sequence}`;
	};
}

export function createQueryGroup(
	id: string,
	options: Partial<Pick<QueryGroup, 'combinator' | 'negated' | 'children'>> = {},
): QueryGroup {
	return {
		type: 'group',
		id,
		combinator: options.combinator ?? 'and',
		negated: options.negated ?? false,
		children: options.children ? [...options.children] : [],
	};
}

export function createQueryRule(id: string, field: string, operator: string, value: QueryJsonValue = null): QueryRule {
	return { type: 'rule', id, field, operator, value };
}

export function getQueryOperatorMap(operators: readonly QueryOperator[] = defaultQueryOperators) {
	return new Map(operators.map((operator) => [operator.name, operator]));
}

export function getOperatorsForField(
	field: QueryField,
	operators: readonly QueryOperator[] = defaultQueryOperators,
): QueryOperator[] {
	const allowed = new Set(field.operators ?? defaultOperatorsByKind[field.kind]);
	return operators.filter(
		(operator) => allowed.has(operator.name) && (!operator.kinds || operator.kinds.includes(field.kind)),
	);
}

export function getDefaultOperatorForField(
	field: QueryField,
	operators: readonly QueryOperator[] = defaultQueryOperators,
) {
	const available = getOperatorsForField(field, operators);
	return available.find((operator) => operator.name === field.defaultOperator) ?? available[0];
}

export function getDefaultValueForOperator(field: QueryField, operator?: QueryOperator): QueryJsonValue {
	if (!operator) return null;
	if (field.defaultValue !== undefined && operator.cardinality === 'single' && field.kind !== 'array')
		return cloneQueryJsonValue(field.defaultValue);
	switch (operator.cardinality) {
		case 'none':
			return null;
		case 'pair':
			return [null, null];
		case 'many':
			return [];
		case 'single':
			return field.kind === 'boolean' ? true : null;
	}
}

export function createQueryRuleForField(
	field: QueryField,
	id: string,
	operators: readonly QueryOperator[] = defaultQueryOperators,
) {
	const operator = getDefaultOperatorForField(field, operators);
	return createQueryRule(id, field.name, operator?.name ?? '', getDefaultValueForOperator(field, operator));
}

export function cloneQueryJsonValue(value: QueryJsonValue): QueryJsonValue {
	if (!isQueryJsonValue(value)) throw new TypeError('Cannot clone an invalid runtime JSON value.');
	return cloneQueryJsonValueUnchecked(value, new WeakMap());
}

function cloneQueryJsonValueUnchecked(value: QueryJsonValue, clones: WeakMap<object, QueryJsonValue>): QueryJsonValue {
	if (value && typeof value === 'object') {
		const existing = clones.get(value);
		if (existing !== undefined) return existing;
	}
	if (Array.isArray(value)) {
		const output: QueryJsonValue[] = [];
		clones.set(value, output);
		for (const item of value) output.push(cloneQueryJsonValueUnchecked(item, clones));
		return output;
	}
	if (value && typeof value === 'object') {
		const output = Object.create(Object.getPrototypeOf(value)) as Record<string, QueryJsonValue>;
		clones.set(value, output);
		for (const [key, item] of Object.entries(value)) {
			Object.defineProperty(output, key, {
				value: cloneQueryJsonValueUnchecked(item, clones),
				enumerable: true,
				configurable: true,
				writable: true,
			});
		}
		return output;
	}
	return value;
}

export function isQueryJsonValue(value: unknown): value is QueryJsonValue {
	const ancestors = new WeakSet<object>();
	const visitedDepth = new WeakMap<object, number>();
	const stack: { value: unknown; depth: number; exiting?: boolean }[] = [{ value, depth: 0 }];
	while (stack.length) {
		const current = stack.pop() as { value: unknown; depth: number; exiting?: boolean };
		const item = current.value;
		if (current.exiting) {
			ancestors.delete(item as object);
			continue;
		}
		if (item === null || typeof item === 'string' || typeof item === 'boolean') continue;
		if (typeof item === 'number') {
			if (!Number.isFinite(item)) return false;
			continue;
		}
		if (!item || typeof item !== 'object') return false;
		if (!Array.isArray(item)) {
			const prototype = Object.getPrototypeOf(item);
			if (prototype !== Object.prototype && prototype !== null) return false;
		}
		if (current.depth > 64 || ancestors.has(item)) return false;
		const previousDepth = visitedDepth.get(item);
		if (previousDepth !== undefined && previousDepth >= current.depth) continue;
		visitedDepth.set(item, current.depth);
		const children: unknown[] = [];
		if (Array.isArray(item)) {
			for (let index = 0; index < item.length; index += 1) {
				if (!(index in item)) return false;
				children.push(item[index]);
			}
		} else {
			children.push(...Object.values(item));
		}
		ancestors.add(item);
		stack.push({ value: item, depth: current.depth, exiting: true });
		for (let index = children.length - 1; index >= 0; index -= 1) {
			stack.push({ value: children[index], depth: current.depth + 1 });
		}
	}
	return true;
}
