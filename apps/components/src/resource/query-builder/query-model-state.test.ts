import { describe, expect, it } from 'vite-plus/test';
import type { QueryAction, QueryField, QueryGroup, QueryJsonValue } from './index';
import {
	areQueriesEqual,
	cloneQuery,
	cloneQueryJsonValue,
	cloneQueryNode,
	countQueryRules,
	createQueryGroup,
	createQueryIdFactory,
	createQueryRule,
	createQueryRuleForField,
	defaultQueryOperators,
	getDefaultOperatorForField,
	getDefaultValueForOperator,
	getQueryDepth,
	isQueryGroupValue,
	isQueryJsonValue,
	reduceQuery,
	validateQuery,
	walkQuery,
} from './index';

const fields: QueryField[] = [
	{ name: '/name', label: 'Name', kind: 'string' },
	{ name: '/amount', label: 'Amount', kind: 'number' },
	{ name: '/active', label: 'Active', kind: 'boolean' },
	{
		name: '/status',
		label: 'Status',
		kind: 'enum',
		options: [
			{ value: 'active', label: 'Active' },
			{ value: 'paused', label: 'Paused' },
		],
	},
];

function fixture(): QueryGroup {
	return createQueryGroup('root', {
		children: [
			createQueryRule('rule-name', '/name', 'contains', 'acme'),
			createQueryGroup('group-nested', {
				combinator: 'or',
				children: [createQueryRule('rule-amount', '/amount', 'gte', 100)],
			}),
		],
	});
}

describe('query model', () => {
	it('derives field-compatible operators and cardinality-shaped defaults', () => {
		const amount = fields[1];
		const operator = getDefaultOperatorForField(amount, defaultQueryOperators);
		expect(operator?.name).toBe('eq');
		expect(
			getDefaultValueForOperator(
				amount,
				defaultQueryOperators.find((item) => item.name === 'between'),
			),
		).toEqual([null, null]);
		expect(
			getDefaultValueForOperator(
				amount,
				defaultQueryOperators.find((item) => item.name === 'in'),
			),
		).toEqual([]);
		expect(
			getDefaultValueForOperator(
				amount,
				defaultQueryOperators.find((item) => item.name === 'isNull'),
			),
		).toBeNull();
		expect(createQueryRuleForField(fields[2], 'boolean-rule').value).toBe(true);
		expect(
			createQueryRuleForField(
				{ name: '/tags', label: 'Tags', kind: 'array', itemKind: 'string', defaultValue: ['priority'] },
				'array-rule',
			).value,
		).toBeNull();
	});

	it('creates deterministic IDs and counts only group nesting', () => {
		const ids = createQueryIdFactory('test');
		expect(ids('group')).toBe('test-group-1');
		expect(ids('rule')).toBe('test-rule-2');
		expect(getQueryDepth(createQueryGroup('flat', { children: [createQueryRule('rule', '/name', 'eq', 'x')] }))).toBe(
			0,
		);
		expect(getQueryDepth(fixture())).toBe(1);
		expect(countQueryRules(fixture())).toBe(2);
	});

	it('accepts only dense, plain, finite JSON values', () => {
		expect(isQueryJsonValue(['active', { score: 1 }])).toBe(true);
		expect(isQueryJsonValue(Array(1))).toBe(false);
		expect(isQueryJsonValue(new Date())).toBe(false);
		expect(isQueryJsonValue(Number.POSITIVE_INFINITY)).toBe(false);
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		expect(isQueryJsonValue(cyclic)).toBe(false);
		expect(() => cloneQueryJsonValue(cyclic as never)).toThrow(TypeError);
		let deep: unknown = 'value';
		for (let index = 0; index < 10_000; index += 1) deep = [deep];
		expect(isQueryJsonValue(deep)).toBe(false);
		let shared: unknown = { leaf: true };
		for (let index = 0; index < 22; index += 1) shared = [shared, shared];
		expect(isQueryJsonValue(shared)).toBe(true);
		const sharedClone = cloneQueryJsonValue(shared as never);
		let cursor: unknown = sharedClone;
		for (let index = 0; index < 22; index += 1) {
			expect(Array.isArray(cursor)).toBe(true);
			expect((cursor as unknown[])[0]).toBe((cursor as unknown[])[1]);
			cursor = (cursor as unknown[])[0];
		}
		const sharedQuery = createQueryGroup('shared-root', {
			children: [createQueryRule('shared-rule', '/name', 'eq', shared as never)],
		});
		expect(areQueriesEqual(sharedQuery, cloneQuery(sharedQuery))).toBe(true);
		let suffix: unknown = { leaf: true };
		for (let index = 0; index < 8; index += 1) suffix = [suffix];
		let deepPath = suffix;
		for (let index = 0; index < 60; index += 1) deepPath = [deepPath];
		expect(isQueryJsonValue([suffix, deepPath])).toBe(false);
		expect(isQueryJsonValue([deepPath, suffix])).toBe(false);
		const specialKeys = JSON.parse('{"__proto__":{"safe":true},"constructor":"value"}') as QueryJsonValue;
		expect(isQueryJsonValue(specialKeys)).toBe(true);
		const specialClone = cloneQueryJsonValue(specialKeys) as Record<string, QueryJsonValue>;
		expect(Object.hasOwn(specialClone, '__proto__')).toBe(true);
		expect(specialClone.__proto__).toEqual({ safe: true });
		expect(specialClone.constructor).toBe('value');
		expect(isQueryJsonValue(specialClone)).toBe(true);
		const specialQuery = createQueryGroup('special-root', {
			children: [createQueryRule('special-rule', '/name', 'eq', specialKeys)],
		});
		expect(isQueryGroupValue(cloneQuery(specialQuery))).toBe(true);
	});
});

describe('query reducer', () => {
	it('inserts, updates, moves, and removes without mutating the input', () => {
		const original = fixture();
		const inserted = reduceQuery(original, {
			type: 'insert-node',
			parentId: 'root',
			index: 1,
			node: createQueryRule('rule-status', '/status', 'eq', 'active'),
		});
		expect(inserted).not.toBe(original);
		expect(original.children).toHaveLength(2);
		expect(inserted.children.map((node) => node.id)).toEqual(['rule-name', 'rule-status', 'group-nested']);

		const updated = reduceQuery(inserted, {
			type: 'update-rule',
			id: 'rule-status',
			patch: { operator: 'in', value: ['active', 'paused'] },
		});
		expect(updated.children[1]).toMatchObject({ operator: 'in', value: ['active', 'paused'] });

		const moved = reduceQuery(updated, { type: 'move-node', id: 'rule-status', direction: 'up' });
		expect(moved.children.map((node) => node.id)).toEqual(['rule-status', 'rule-name', 'group-nested']);

		const removed = reduceQuery(moved, { type: 'remove-node', id: 'rule-amount' });
		expect(countQueryRules(removed)).toBe(2);
		expect(countQueryRules(moved)).toBe(3);
	});

	it('rejects root removal, duplicate IDs, impossible moves, and excessive depth by reference', () => {
		const query = fixture();
		expect(reduceQuery(query, { type: 'remove-node', id: 'root' })).toBe(query);
		expect(reduceQuery(query, { type: 'move-node', id: 'rule-name', direction: 'up' })).toBe(query);
		expect(
			reduceQuery(query, {
				type: 'insert-node',
				parentId: 'root',
				node: createQueryRule('rule-name', '/status', 'eq', 'active'),
			}),
		).toBe(query);
		expect(
			reduceQuery(query, {
				type: 'insert-node',
				parentId: 'root',
				node: createQueryRule('  ', '/status', 'eq', 'active'),
			}),
		).toBe(query);
		expect(
			reduceQuery(query, {
				type: 'replace-query',
				query: createQueryRule('runtime-rule', '/status', 'eq', 'active') as unknown as QueryGroup,
			}),
		).toBe(query);
		expect(
			reduceQuery(query, {
				type: 'insert-node',
				parentId: 'root',
				node: { type: 'branch', id: 'bad-type', children: [] },
			} as unknown as QueryAction),
		).toBe(query);

		const nested = createQueryGroup('new-group', {
			children: [createQueryGroup('new-child', { children: [createQueryGroup('new-grandchild')] })],
		});
		expect(reduceQuery(query, { type: 'insert-node', parentId: 'group-nested', node: nested }, { maxDepth: 2 })).toBe(
			query,
		);
	});

	it('rejects invalid replacement trees and clones accepted action payloads', () => {
		const query = fixture();
		const tooDeep = createQueryGroup('replacement', {
			children: [createQueryGroup('level-1', { children: [createQueryGroup('level-2')] })],
		});
		expect(reduceQuery(query, { type: 'replace-query', query: tooDeep }, { maxDepth: 1 })).toBe(query);

		const duplicate = createQueryGroup('replacement', {
			children: [createQueryRule('same', '/name', 'eq', 'a'), createQueryRule('same', '/name', 'eq', 'b')],
		});
		expect(reduceQuery(query, { type: 'replace-query', query: duplicate })).toBe(query);

		const payload = ['active'];
		const updated = reduceQuery(query, {
			type: 'update-rule',
			id: 'rule-name',
			patch: { operator: 'in', value: payload },
		});
		payload.push('paused');
		expect(updated.children[0]).toMatchObject({ value: ['active'] });
		expect(
			reduceQuery(updated, {
				type: 'update-rule',
				id: 'rule-name',
				patch: { operator: 'in', value: ['active'] },
			}),
		).toBe(updated);
	});

	it('fails closed for malformed runtime actions and node shapes', () => {
		const query = fixture();
		expect(reduceQuery(query, null as unknown as QueryAction)).toBe(query);
		expect(reduceQuery(query, { type: 'unknown' } as unknown as QueryAction)).toBe(query);
		expect(
			reduceQuery(query, {
				type: 'insert-node',
				parentId: 'root',
				node: { type: 'group', id: 'bad', combinator: 'and', negated: false, children: null },
			} as unknown as QueryAction),
		).toBe(query);
		expect(
			reduceQuery(query, {
				type: 'replace-query',
				query: { ...query, combinator: 'xor' },
			} as unknown as QueryAction),
		).toBe(query);
		expect(reduceQuery(query, { type: 'update-rule', id: 'rule-name', patch: null } as unknown as QueryAction)).toBe(
			query,
		);
		expect(
			reduceQuery(query, {
				type: 'update-group',
				id: 'root',
				patch: { negated: 'yes' },
			} as unknown as QueryAction),
		).toBe(query);
		const cyclicValue: Record<string, unknown> = {};
		cyclicValue.self = cyclicValue;
		expect(
			reduceQuery(query, {
				type: 'update-rule',
				id: 'rule-name',
				patch: { value: cyclicValue },
			} as unknown as QueryAction),
		).toBe(query);
	});

	it('compares JSON object values using own keys only', () => {
		const query = createQueryGroup('root', {
			children: [createQueryRule('object-rule', '/name', 'eq', JSON.parse('{"__proto__":{}}'))],
		});
		const updated = reduceQuery(query, {
			type: 'update-rule',
			id: 'object-rule',
			patch: { value: { other: 1 } },
		});
		expect(updated).not.toBe(query);
		expect(updated.children[0]).toMatchObject({ value: { other: 1 } });
	});

	it('clones every node ID and preserves JSON values', () => {
		const query = fixture();
		const cloned = cloneQueryNode(query.children[1], createQueryIdFactory('copy'));
		expect(cloned).toMatchObject({ id: 'copy-group-1', type: 'group' });
		expect(cloned.type === 'group' && cloned.children[0].id).toBe('copy-rule-2');
		expect(cloned).not.toBe(query.children[1]);

		const preserved = cloneQuery(query);
		expect(areQueriesEqual(query, preserved)).toBe(true);
		expect(preserved).not.toBe(query);
	});
});

describe('query validation', () => {
	it('returns an invalid-query issue for malformed runtime documents', () => {
		expect(validateQuery(null as unknown as QueryGroup, { fields })[0]?.code).toBe('invalid-query');
		expect(validateQuery({ ...fixture(), children: null } as unknown as QueryGroup, { fields })[0]?.code).toBe(
			'invalid-query',
		);
		let deep = createQueryGroup('deep-leaf');
		for (let index = 0; index < 10_000; index += 1) {
			deep = createQueryGroup(`deep-${index}`, { children: [deep] });
		}
		expect(isQueryGroupValue(deep)).toBe(false);
		expect(isQueryGroupValue(deep, Number.NaN)).toBe(false);
		expect(validateQuery(deep, { fields })[0]?.code).toBe('invalid-query');
		expect(() => cloneQuery(deep)).toThrow(TypeError);
		let deepVisits = 0;
		walkQuery(deep, () => {
			deepVisits += 1;
		});
		expect(deepVisits).toBe(65);
		const cyclicAst = createQueryGroup('cyclic-root');
		cyclicAst.children.push(cyclicAst);
		let cyclicVisits = 0;
		walkQuery(cyclicAst, () => {
			cyclicVisits += 1;
		});
		expect(cyclicVisits).toBe(1);
		expect(countQueryRules(cyclicAst)).toBe(0);
		expect(getQueryDepth(cyclicAst)).toBe(0);
		const sharedRule = createQueryRule('shared-rule', '/name', 'eq', 'value');
		const sharedAst = createQueryGroup('shared-root', { children: [sharedRule, sharedRule] });
		expect(validateQuery(sharedAst, { fields })[0]?.code).toBe('invalid-query');
		let amplified = sharedRule as QueryGroup['children'][number];
		for (let index = 0; index < 22; index += 1) {
			amplified = createQueryGroup(`shared-${index}`, { children: [amplified, amplified] });
		}
		expect(validateQuery(amplified as QueryGroup, { fields })[0]?.code).toBe('invalid-query');
	});

	it('accepts a valid nested query', () => {
		expect(validateQuery(fixture(), { fields })).toEqual([]);
	});

	it('reports duplicate IDs, unknown capabilities, cardinality, missing, and typed values', () => {
		const query = createQueryGroup('root', {
			children: [
				createQueryRule('duplicate', '/missing', 'eq', 'x'),
				createQueryRule('duplicate', '/name', 'missing', 'x'),
				createQueryRule('pair', '/amount', 'between', [1]),
				createQueryRule('many', '/status', 'in', []),
				createQueryRule('typed', '/amount', 'eq', 'not-a-number'),
				createQueryRule('not-allowed', '/active', 'contains', true),
			],
		});
		const codes = validateQuery(query, { fields }).map((issue) => issue.code);
		expect(codes).toContain('duplicate-id');
		expect(codes).toContain('unknown-field');
		expect(codes).toContain('unknown-operator');
		expect(codes).toContain('invalid-cardinality');
		expect(codes).toContain('missing-value');
		expect(codes).toContain('invalid-value');
		expect(codes).toContain('operator-not-allowed');
	});

	it('reports groups deeper than the configured maximum', () => {
		const query = createQueryGroup('root', {
			children: [createQueryGroup('level-1', { children: [createQueryGroup('level-2')] })],
		});
		expect(validateQuery(query, { fields, maxDepth: 1 }).some((issue) => issue.code === 'max-depth')).toBe(true);
	});

	it('rejects sparse cardinality arrays and invalid calendar values', () => {
		const sparse = Array(2) as unknown as [number, number];
		const query = createQueryGroup('root', {
			children: [
				createQueryRule('sparse', '/amount', 'between', sparse),
				createQueryRule('date', '/name', 'eq', '2026-02-30'),
			],
		});
		const dateFields: QueryField[] = [{ name: '/name', label: 'Date', kind: 'date' }, ...fields.slice(1)];
		const issues = validateQuery(query, { fields: dateFields });
		expect(issues.find((issue) => issue.nodeId === 'sparse')?.code).toBe('invalid-value');
		expect(issues.find((issue) => issue.nodeId === 'date')?.code).toBe('invalid-value');

		const datetimeFields: QueryField[] = [{ name: '/name', label: 'Time', kind: 'datetime' }, ...fields.slice(1)];
		const invalidTime = createQueryGroup('time-root', {
			children: [createQueryRule('time', '/name', 'eq', '2026-01-01T25:00')],
		});
		expect(validateQuery(invalidTime, { fields: datetimeFields })[0]?.code).toBe('invalid-value');
		const localTime = createQueryGroup('local-time-root', {
			children: [createQueryRule('local-time', '/name', 'eq', '2026-01-01T10:30:00')],
		});
		expect(validateQuery(localTime, { fields: datetimeFields })[0]?.code).toBe('invalid-value');
		const utcTime = createQueryGroup('utc-time-root', {
			children: [createQueryRule('utc-time', '/name', 'eq', '2026-01-01T10:30:00Z')],
		});
		expect(validateQuery(utcTime, { fields: datetimeFields })).toEqual([]);
	});
});
