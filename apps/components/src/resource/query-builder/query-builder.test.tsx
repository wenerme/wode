import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
	createQueryGroup,
	createQueryRule,
	defaultQueryOperators,
	QueryBuilder,
	type QueryField,
	type QueryGroup,
	type QueryValueEditorProps,
	useQueryBuilderDraft,
} from './index';

const fields: QueryField[] = [
	{
		name: '/status',
		label: 'Status',
		kind: 'enum',
		group: 'Lifecycle',
		options: [
			{ value: 'active', label: 'Active' },
			{ value: 'paused', label: 'Paused' },
		],
	},
	{ name: '/amount', label: 'Revenue', kind: 'number', group: 'Commercial' },
	{ name: '/ownerId', label: 'Owner', kind: 'string', group: 'Relations', editor: 'owner' },
	{ name: '/scores', label: 'Scores', kind: 'array', itemKind: 'number' },
	{ name: '/flags', label: 'Flags', kind: 'array', itemKind: 'boolean' },
];

const query = createQueryGroup('root', {
	children: [
		createQueryRule('status-rule', '/status', 'eq', 'active'),
		createQueryGroup('nested', {
			combinator: 'or',
			children: [
				createQueryRule('amount-rule', '/amount', 'gte', 1000),
				createQueryRule('owner-rule', '/ownerId', 'eq', 'user-1'),
			],
		}),
	],
});

function OwnerEditor({ value, disabled, readOnly, onChange }: QueryValueEditorProps) {
	if (readOnly) return <output>Ada</output>;
	return (
		<select
			aria-label='Custom owner'
			disabled={disabled}
			value={String(value ?? '')}
			onChange={(event) => onChange(event.target.value)}
		>
			<option value='user-1'>Ada</option>
			<option value='user-2'>Lin</option>
		</select>
	);
}

function InvalidDraftHarness({ value }: { value: QueryGroup }) {
	const draft = useQueryBuilderDraft({ value });
	return (
		<output>
			{String(draft.invalidExternal)}:{draft.draft.id}
		</output>
	);
}

describe('QueryBuilder', () => {
	it('renders nested controlled groups, searchable add controls, and custom editors', () => {
		const markup = renderToStaticMarkup(
			<QueryBuilder
				query={query}
				fields={fields}
				title='Customer filters'
				description='Build a reusable customer segment'
				valueEditors={{ owner: OwnerEditor }}
				onQueryChange={() => undefined}
			/>,
		);
		expect(markup).toContain('data-slot="query-builder"');
		expect(markup).toContain('data-valid="true"');
		expect(markup).toContain('Customer filters');
		expect(markup).toContain('3 个条件');
		expect(markup).toContain('role="radiogroup"');
		expect(markup).toContain('name="query-combinator-');
		expect(markup).toContain('Custom owner');
		expect(markup).toContain('添加条件');
		expect(markup).toContain('aria-label="复制：Status"');
		expect(markup).toContain('aria-label="删除：Status"');
	});

	it('renders validation issues for incomplete rules', () => {
		const invalid = createQueryGroup('root', {
			children: [createQueryRule('invalid', '/amount', 'between', [10])],
		});
		const markup = renderToStaticMarkup(
			<QueryBuilder query={invalid} fields={fields} onQueryChange={() => undefined} />,
		);
		expect(markup).toContain('data-valid="false"');
		expect(markup).toContain('此操作符需要两个值。');
		expect(markup).toContain('1 个问题');
		expect(markup).toContain('aria-invalid="true"');
		expect(markup).toContain('aria-describedby=');
	});

	it('allows messages to replace validation and fallback accessibility copy', () => {
		const invalid = createQueryGroup('root', {
			children: [createQueryRule('invalid', '/missing', 'eq', 'value')],
		});
		const markup = renderToStaticMarkup(
			<QueryBuilder
				query={invalid}
				fields={fields}
				messages={{
					validationIssue: () => 'Custom validation issue',
					unknownField: 'Custom unknown field',
					queryCondition: 'Custom condition',
					actionsLabel: (label) => `Actions for ${label}`,
					actionLabel: (action, target) => `${action} for ${target}`,
					remove: 'Remove',
				}}
				onQueryChange={() => undefined}
			/>,
		);
		expect(markup).toContain('Custom validation issue');
		expect(markup).toContain('Custom unknown field');
		expect(markup).toContain('aria-label="Actions for Custom condition"');
		expect(markup).toContain('aria-label="Remove for Custom condition"');

		const selected = createQueryGroup('selected-root', {
			children: [createQueryRule('selected-rule', '/status', 'in', ['active'])],
		});
		const selectedMarkup = renderToStaticMarkup(
			<QueryBuilder
				query={selected}
				fields={fields}
				messages={{
					removeValue: 'Remove value',
					actionLabel: (action, target) => `${action} for ${target}`,
				}}
				onQueryChange={() => undefined}
			/>,
		);
		expect(selectedMarkup).toContain('aria-label="Remove value for Active"');
	});

	it('renders and associates group-level validation messages', () => {
		const tooDeep = createQueryGroup('root', {
			children: [
				createQueryGroup('level-1', {
					children: [createQueryGroup('level-2')],
				}),
			],
		});
		const markup = renderToStaticMarkup(
			<QueryBuilder query={tooDeep} fields={fields} maxDepth={1} onQueryChange={() => undefined} />,
		);
		expect(markup).toContain('分组最多可嵌套 1 层。');
		expect(markup).toContain('aria-describedby=');
		expect(markup).toContain('role="alert"');
	});

	it('renders a fail-closed alert for malformed runtime query input', () => {
		const markup = renderToStaticMarkup(
			<QueryBuilder query={null as unknown as QueryGroup} fields={fields} onQueryChange={() => undefined} />,
		);
		expect(markup).toContain('data-valid="false"');
		expect(markup).toContain('查询条件结构无效。');
		expect(markup).toContain('role="alert"');
		const hiddenValidation = renderToStaticMarkup(
			<QueryBuilder
				query={null as unknown as QueryGroup}
				fields={fields}
				showValidation={false}
				onQueryChange={() => undefined}
			/>,
		);
		expect(hiddenValidation).toContain('data-valid="false"');
	});

	it('initializes draft state safely for cyclic external input', () => {
		const cyclic = createQueryGroup('cyclic');
		cyclic.children.push(cyclic);
		const markup = renderToStaticMarkup(<InvalidDraftHarness value={cyclic} />);
		expect(markup).toContain('true:query-invalid-external');
	});

	it('keeps read-only queries inspectable while hiding mutation actions', () => {
		const markup = renderToStaticMarkup(
			<QueryBuilder query={query} fields={fields} readOnly onQueryChange={() => undefined} />,
		);
		expect(markup).toContain('data-readonly="true"');
		expect(markup).toContain('<output');
		expect(markup).toContain('tabindex="0"');
		expect(markup).not.toContain('aria-label="复制：');
		expect(markup).not.toContain('aria-label="删除：');
		expect(markup).not.toContain('添加条件');
	});

	it('renders a useful empty state and allows renderValueEditor to override registered editors', () => {
		const empty = renderToStaticMarkup(
			<QueryBuilder query={createQueryGroup('root')} fields={fields} onQueryChange={() => undefined} />,
		);
		expect(empty).toContain('暂无条件');

		const overridden = renderToStaticMarkup(
			<QueryBuilder
				query={query}
				fields={fields}
				valueEditors={{ owner: OwnerEditor }}
				renderValueEditor={(props) => (props.rule.id === 'owner-rule' ? <div>Rendered owner override</div> : undefined)}
				onQueryChange={() => undefined}
			/>,
		);
		expect(overridden).toContain('Rendered owner override');
		expect(overridden).not.toContain('Custom owner');
	});

	it('uses unique pair input IDs and gives field editors precedence over operator editors', () => {
		const between = createQueryGroup('root', {
			children: [createQueryRule('amount-rule', '/amount', 'between', [10, 20])],
		});
		const pairMarkup = renderToStaticMarkup(
			<QueryBuilder query={between} fields={fields} onQueryChange={() => undefined} />,
		);
		expect(pairMarkup).toContain('-start"');
		expect(pairMarkup).toContain('-end"');
		const ids = [...pairMarkup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
		expect(new Set(ids).size).toBe(ids.length);

		const precedenceFields = fields.map((field) =>
			field.name === '/amount' ? { ...field, editor: 'field-editor' } : field,
		);
		const precedenceOperators = defaultQueryOperators.map((operator) =>
			operator.name === 'gte' ? { ...operator, editor: 'operator-editor' } : operator,
		);
		const precedenceMarkup = renderToStaticMarkup(
			<QueryBuilder
				query={query}
				fields={precedenceFields}
				operators={precedenceOperators}
				valueEditors={{
					'field-editor': () => <div>Field editor wins</div>,
					'operator-editor': () => <div>Operator editor loses</div>,
				}}
				onQueryChange={() => undefined}
			/>,
		);
		expect(precedenceMarkup).toContain('Field editor wins');
		expect(precedenceMarkup).not.toContain('Operator editor loses');

		const fallbackMarkup = renderToStaticMarkup(
			<QueryBuilder
				query={query}
				fields={precedenceFields}
				operators={precedenceOperators}
				valueEditors={{ 'operator-editor': () => <div>Operator editor fallback</div> }}
				onQueryChange={() => undefined}
			/>,
		);
		expect(fallbackMarkup).toContain('Operator editor fallback');

		const constructorFields = fields.map((field) =>
			field.name === '/ownerId' ? { ...field, editor: 'constructor' } : field,
		);
		const ownerQuery = createQueryGroup('owner-root', {
			children: [createQueryRule('owner-rule', '/ownerId', 'eq', 'user-1')],
		});
		const inheritedEditorMarkup = renderToStaticMarkup(
			<QueryBuilder query={ownerQuery} fields={constructorFields} valueEditors={{}} onQueryChange={() => undefined} />,
		);
		expect(inheritedEditorMarkup).not.toContain('Custom owner');
		const ownEditors = Object.create(null) as Record<string, typeof OwnerEditor>;
		ownEditors.constructor = OwnerEditor;
		const ownEditorMarkup = renderToStaticMarkup(
			<QueryBuilder
				query={ownerQuery}
				fields={constructorFields}
				valueEditors={ownEditors}
				onQueryChange={() => undefined}
			/>,
		);
		expect(ownEditorMarkup).toContain('Custom owner');
	});

	it('isolates radio groups, preserves unavailable operators, and edits array item scalars by item kind', () => {
		const doubled = renderToStaticMarkup(
			<>
				<QueryBuilder query={query} fields={fields} onQueryChange={() => undefined} />
				<QueryBuilder query={query} fields={fields} onQueryChange={() => undefined} />
			</>,
		);
		const radioNames = [...doubled.matchAll(/name="(query-combinator-[^"]+)"/g)].map((match) => match[1]);
		expect(new Set(radioNames).size).toBe(radioNames.length / 2);

		const unavailable = createQueryGroup('unavailable-root', {
			children: [createQueryRule('unavailable-rule', '/status', 'contains', 'act')],
		});
		const unavailableMarkup = renderToStaticMarkup(
			<QueryBuilder query={unavailable} fields={fields} onQueryChange={() => undefined} />,
		);
		expect(unavailableMarkup).toContain('包含（不可用）');
		expect(unavailableMarkup).toContain('aria-invalid="true"');

		const arrayScalar = createQueryGroup('array-root', {
			children: [createQueryRule('array-rule', '/scores', 'contains', 5)],
		});
		const arrayMarkup = renderToStaticMarkup(
			<QueryBuilder query={arrayScalar} fields={fields} onQueryChange={() => undefined} />,
		);
		expect(arrayMarkup).toContain('type="number"');
		expect(arrayMarkup).toContain('value="5"');

		const booleanMany = createQueryGroup('boolean-array-root', {
			children: [createQueryRule('boolean-array-rule', '/flags', 'containsAny', [])],
		});
		const booleanMarkup = renderToStaticMarkup(
			<QueryBuilder query={booleanMany} fields={fields} onQueryChange={() => undefined} />,
		);
		expect(booleanMarkup).toContain('<option value="true">是</option>');
		expect(booleanMarkup).toContain('<option value="false">否</option>');
	});
});
