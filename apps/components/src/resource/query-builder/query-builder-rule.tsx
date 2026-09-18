import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { QueryBuilderContext } from './query-builder-context';
import type { QueryValueEditorProps } from './query-editors';
import { QueryDefaultValueEditor, QueryFieldPicker } from './query-editors';
import type { QueryField, QueryNode, QueryOperator, QueryRule } from './query-model';
import { createQueryRuleForField, getDefaultValueForOperator, getOperatorsForField } from './query-model';
import { cloneQueryNode, countQueryRules } from './query-state';

export type QueryBuilderRuleProps = {
	rule: QueryRule;
	parentId: string;
	context: QueryBuilderContext;
	index: number;
	siblingCount: number;
};

export function QueryBuilderRule({ rule, parentId, context, index, siblingCount }: QueryBuilderRuleProps) {
	const field = context.fieldMap.get(rule.field);
	const availableOperators = field ? getOperatorsForField(field, context.operators) : [];
	const operator = context.operatorMap.get(rule.operator);
	const operatorAllowed = Boolean(operator && availableOperators.some((candidate) => candidate.name === operator.name));
	const issues = context.issuesByNode.get(rule.id) ?? [];
	const invalid = issues.length > 0;
	const editorId = useId();
	const issueId = `${editorId}-issues`;
	return (
		<div
			data-slot='query-rule'
			data-rule-id={rule.id}
			role='group'
			aria-label={field ? context.messages.conditionLabel(field.label) : context.messages.queryCondition}
			tabIndex={context.readOnly ? 0 : undefined}
			className={cn(
				'border-base-300 bg-base-100 grid min-w-0 gap-2 rounded-md border p-2',
				'lg:grid-cols-[minmax(9rem,.9fr)_minmax(9rem,.75fr)_minmax(12rem,1.4fr)_auto] lg:items-start',
				invalid && 'border-warning/60',
			)}
		>
			<div className='min-w-0'>
				<span className='text-base-content/65 mb-1 block text-[11px] lg:sr-only'>{context.messages.chooseField}</span>
				{context.readOnly ? (
					<output className='border-base-300 flex min-h-8 w-full items-center rounded-sm border px-2.5 text-sm'>
						{field?.label ?? context.messages.unknownField}
					</output>
				) : (
					<QueryFieldPicker
						fields={context.fields}
						label={field?.label ?? context.messages.unknownField}
						searchLabel={context.messages.searchFields}
						emptyLabel={context.messages.noFields}
						disabled={context.disabled}
						invalid={!field}
						ariaDescribedBy={invalid ? issueId : undefined}
						className='w-full'
						onSelect={(nextField) => {
							const nextRule = createQueryRuleForField(nextField, rule.id, context.operators);
							context.dispatch({
								type: 'update-rule',
								id: rule.id,
								patch: { field: nextRule.field, operator: nextRule.operator, value: nextRule.value },
							});
						}}
					/>
				)}
			</div>
			<div className='min-w-0'>
				<span className='text-base-content/65 mb-1 block text-[11px] lg:sr-only'>
					{context.messages.chooseOperator}
				</span>
				{context.readOnly ? (
					<output className='border-base-300 flex min-h-8 w-full items-center rounded-sm border px-2.5 text-sm'>
						{operatorAllowed
							? operator?.label
							: context.messages.unavailableOperator(operator?.label ?? context.messages.unknownOperator)}
					</output>
				) : (
					<select
						className='select select-bordered select-sm w-full min-w-0'
						aria-label={context.messages.chooseOperator}
						aria-invalid={!operatorAllowed || undefined}
						aria-describedby={invalid ? issueId : undefined}
						disabled={context.disabled || !field}
						value={rule.operator}
						onChange={(event) => {
							if (!field) return;
							const nextOperator = context.operatorMap.get(event.target.value);
							if (!nextOperator) return;
							context.dispatch({
								type: 'update-rule',
								id: rule.id,
								patch: { operator: nextOperator.name, value: getDefaultValueForOperator(field, nextOperator) },
							});
						}}
					>
						{!operatorAllowed ? (
							<option value={rule.operator} disabled>
								{context.messages.unavailableOperator(operator?.label ?? context.messages.unknownOperator)}
							</option>
						) : null}
						{availableOperators.map((candidate) => (
							<option key={candidate.name} value={candidate.name}>
								{candidate.label}
							</option>
						))}
					</select>
				)}
			</div>
			<div className='min-w-0'>
				<span className='text-base-content/65 mb-1 block text-[11px] lg:sr-only'>{context.messages.chooseValue}</span>
				{field && operator ? (
					renderEditor({ context, editorId, issueId, field, operator, rule, invalid })
				) : (
					<div className='bg-base-200 h-8 rounded-sm' />
				)}
			</div>
			{!context.readOnly ? (
				<NodeActions node={rule} parentId={parentId} context={context} index={index} siblingCount={siblingCount} />
			) : null}
			{context.showValidation && issues.length ? (
				<div
					className='border-warning/40 bg-warning/15 text-base-content col-span-full min-w-0 rounded-sm border px-2 py-1 text-xs'
					id={issueId}
					role='alert'
				>
					{issues[0].message}
				</div>
			) : null}
		</div>
	);
}

function renderEditor({
	context,
	editorId,
	issueId,
	field,
	operator,
	rule,
	invalid,
}: {
	context: QueryBuilderContext;
	editorId: string;
	issueId: string;
	field: QueryField;
	operator: QueryOperator;
	rule: QueryRule;
	invalid: boolean;
}) {
	const props: QueryValueEditorProps = {
		id: editorId,
		rule,
		field,
		operator,
		value: rule.value,
		disabled: context.disabled,
		readOnly: context.readOnly,
		invalid,
		ariaDescribedBy: invalid ? issueId : undefined,
		messages: context.messages,
		onChange: (value) => context.dispatch({ type: 'update-rule', id: rule.id, patch: { value } }),
	};
	const rendered = context.renderValueEditor?.(props);
	if (rendered !== undefined) return rendered;
	const getEditor = (name: string | undefined) =>
		name && context.valueEditors && Object.hasOwn(context.valueEditors, name) ? context.valueEditors[name] : undefined;
	const Editor = getEditor(field.editor) ?? getEditor(operator.editor);
	return Editor ? <Editor {...props} /> : <QueryDefaultValueEditor {...props} />;
}

export function NodeActions({
	node,
	parentId,
	context,
	index,
	siblingCount,
}: {
	node: QueryNode;
	parentId: string;
	context: QueryBuilderContext;
	index: number;
	siblingCount: number;
}) {
	const nodeLabel =
		node.type === 'rule'
			? (context.fieldMap.get(node.field)?.label ?? context.messages.queryCondition)
			: context.messages.groupLabel(countQueryRules(node));
	const actionLabel = (label: string) => context.messages.actionLabel(label, nodeLabel);
	return (
		<div
			className='flex shrink-0 items-center justify-end gap-0.5 lg:self-center'
			role='toolbar'
			aria-label={context.messages.actionsLabel(nodeLabel)}
		>
			<ActionButton
				label={actionLabel(context.messages.moveUp)}
				disabled={context.disabled || index === 0}
				onClick={() => context.dispatch({ type: 'move-node', id: node.id, direction: 'up' })}
			>
				<ArrowUp aria-hidden='true' className='size-3.5' />
			</ActionButton>
			<ActionButton
				label={actionLabel(context.messages.moveDown)}
				disabled={context.disabled || index >= siblingCount - 1}
				onClick={() => context.dispatch({ type: 'move-node', id: node.id, direction: 'down' })}
			>
				<ArrowDown aria-hidden='true' className='size-3.5' />
			</ActionButton>
			<ActionButton
				label={actionLabel(context.messages.duplicate)}
				disabled={context.disabled}
				onClick={() =>
					context.dispatch({
						type: 'insert-node',
						parentId,
						index: index + 1,
						node: cloneQueryNode(node, context.createId),
					})
				}
			>
				<Copy aria-hidden='true' className='size-3.5' />
			</ActionButton>
			<ActionButton
				label={actionLabel(context.messages.remove)}
				disabled={context.disabled}
				danger
				onClick={() => context.dispatch({ type: 'remove-node', id: node.id })}
			>
				<Trash2 aria-hidden='true' className='size-3.5' />
			</ActionButton>
		</div>
	);
}

function ActionButton({
	label,
	disabled,
	danger,
	onClick,
	children,
}: {
	label: string;
	disabled?: boolean;
	danger?: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type='button'
			className={cn('btn btn-ghost btn-sm btn-square lg:btn-xs', danger && 'text-error')}
			title={label}
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
		>
			{children}
		</button>
	);
}
