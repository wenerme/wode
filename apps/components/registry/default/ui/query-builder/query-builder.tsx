import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Layers3, Plus, Trash2 } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { QueryValueEditorComponent, QueryValueEditorProps, QueryValueEditorRenderer } from './query-editors';
import { QueryDefaultValueEditor, QueryFieldPicker } from './query-editors';
import type { QueryBuilderMessages } from './query-messages';
import { defaultQueryBuilderMessages } from './query-messages';
import type { QueryField, QueryGroup, QueryIdFactory, QueryNode, QueryOperator, QueryRule } from './query-model';
import {
	createQueryGroup,
	createQueryId,
	createQueryRuleForField,
	defaultQueryOperators,
	getDefaultValueForOperator,
	getOperatorsForField,
} from './query-model';
import type { QueryAction, QueryValidationIssue } from './query-state';
import { cloneQueryNode, countQueryRules, isQueryGroupValue, validateQuery } from './query-state';
import { useQueryBuilderController } from './use-query-builder';

export type QueryBuilderHeadingLevel = 'h2' | 'h3' | 'h4';

export type QueryBuilderProps = Omit<ComponentPropsWithRef<'section'>, 'onChange' | 'title'> & {
	query: QueryGroup;
	fields: readonly QueryField[];
	operators?: readonly QueryOperator[];
	onQueryChange: (query: QueryGroup, action: QueryAction) => void;
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	headingLevel?: QueryBuilderHeadingLevel;
	messages?: Partial<QueryBuilderMessages>;
	valueEditors?: Readonly<Record<string, QueryValueEditorComponent>>;
	renderValueEditor?: QueryValueEditorRenderer;
	createId?: QueryIdFactory;
	maxDepth?: number;
	readOnly?: boolean;
	disabled?: boolean;
	showValidation?: boolean;
};

type BuilderContext = {
	fields: readonly QueryField[];
	fieldMap: ReadonlyMap<string, QueryField>;
	operators: readonly QueryOperator[];
	operatorMap: ReadonlyMap<string, QueryOperator>;
	messages: QueryBuilderMessages;
	issuesByNode: ReadonlyMap<string, readonly QueryValidationIssue[]>;
	valueEditors?: Readonly<Record<string, QueryValueEditorComponent>>;
	renderValueEditor?: QueryValueEditorRenderer;
	createId: QueryIdFactory;
	maxDepth: number;
	readOnly: boolean;
	disabled: boolean;
	showValidation: boolean;
	instanceId: string;
	dispatch: (action: QueryAction) => QueryGroup;
	collapsed: ReadonlySet<string>;
	toggleCollapsed: (id: string) => void;
};

export function QueryBuilder({
	query,
	fields,
	operators = defaultQueryOperators,
	onQueryChange,
	title,
	description,
	actions,
	headingLevel: Heading = 'h2',
	messages: messageOverrides,
	valueEditors,
	renderValueEditor,
	createId = createQueryId,
	maxDepth = 4,
	readOnly = false,
	disabled = false,
	showValidation = true,
	className,
	'aria-label': ariaLabel,
	...props
}: QueryBuilderProps) {
	const instanceId = useId();
	const messages = useMemo(() => ({ ...defaultQueryBuilderMessages, ...messageOverrides }), [messageOverrides]);
	const effectiveMaxDepth = Number.isInteger(maxDepth) && maxDepth >= 0 ? Math.min(maxDepth, 64) : 4;
	const reducerOptions = useMemo(() => ({ maxDepth: effectiveMaxDepth }), [effectiveMaxDepth]);
	const { dispatch } = useQueryBuilderController({ query, onQueryChange, reducerOptions });
	const fieldMap = useMemo(() => new Map(fields.map((field) => [field.name, field])), [fields]);
	const operatorMap = useMemo(() => new Map(operators.map((operator) => [operator.name, operator])), [operators]);
	const queryIsValid = useMemo(() => isQueryGroupValue(query), [query]);
	const issues = useMemo(
		() =>
			showValidation
				? validateQuery(query, { fields, operators, maxDepth: effectiveMaxDepth }).map((issue) => ({
						...issue,
						message: messages.validationIssue(issue),
					}))
				: [],
		[effectiveMaxDepth, fields, messages, operators, query, showValidation],
	);
	const issuesByNode = useMemo(() => {
		const map = new Map<string, QueryValidationIssue[]>();
		for (const issue of issues) map.set(issue.nodeId, [...(map.get(issue.nodeId) ?? []), issue]);
		return map;
	}, [issues]);
	const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
	const context: BuilderContext = {
		fields,
		fieldMap,
		operators,
		operatorMap,
		messages,
		issuesByNode,
		valueEditors,
		renderValueEditor,
		createId,
		maxDepth: effectiveMaxDepth,
		readOnly,
		disabled,
		showValidation,
		instanceId,
		dispatch,
		collapsed,
		toggleCollapsed: (id) =>
			setCollapsed((current) => {
				const next = new Set(current);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			}),
	};
	const ruleCount = queryIsValid ? countQueryRules(query) : 0;
	return (
		<section
			data-slot='query-builder'
			data-valid={queryIsValid && issues.length === 0 ? 'true' : 'false'}
			aria-label={ariaLabel ?? (typeof title === 'string' ? title : messages.title)}
			data-readonly={readOnly || undefined}
			className={cn('border-base-300 bg-base-100 min-w-0 overflow-hidden rounded-md border', className)}
			{...props}
		>
			<header className='border-base-300 bg-base-200/35 flex min-h-14 flex-wrap items-start gap-3 border-b px-3 py-3 md:px-4'>
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap items-center gap-2'>
						<Heading className='text-sm font-semibold'>{title ?? messages.title}</Heading>
						<span className='badge badge-outline badge-sm'>{messages.conditionCount(ruleCount)}</span>
						{issues.length ? (
							<span className='badge badge-warning badge-sm'>{messages.validationCount(issues.length)}</span>
						) : null}
					</div>
					{description ? <div className='text-base-content/65 mt-0.5 text-xs'>{description}</div> : null}
				</div>
				{actions ? (
					<div className='flex w-full max-w-full min-w-0 flex-wrap items-center gap-1 sm:w-auto sm:shrink-0 sm:justify-end'>
						{actions}
					</div>
				) : null}
			</header>
			<div className='p-2 sm:p-3'>
				{queryIsValid ? (
					<QueryBuilderGroup group={query} context={context} depth={0} index={0} siblingCount={1} root />
				) : (
					<div
						className='border-error/40 bg-error/10 text-base-content rounded-sm border px-3 py-4 text-sm'
						role='alert'
					>
						{messages.invalidQuery}
					</div>
				)}
			</div>
			{showValidation ? (
				<div className='sr-only' role='status' aria-live='polite'>
					{issues.length ? messages.validationCount(issues.length) : ''}
				</div>
			) : null}
		</section>
	);
}

type QueryBuilderGroupProps = {
	group: QueryGroup;
	context: BuilderContext;
	depth: number;
	index: number;
	siblingCount: number;
	parentId?: string;
	root?: boolean;
};

function QueryBuilderGroup({
	group,
	context,
	depth,
	index,
	siblingCount,
	parentId,
	root = false,
}: QueryBuilderGroupProps) {
	const { messages } = context;
	const collapsed = context.collapsed.has(group.id);
	const locked = context.disabled;
	const groupIssues = context.issuesByNode.get(group.id) ?? [];
	const groupIssueId = useId();
	return (
		<fieldset
			data-slot='query-group'
			data-depth={depth}
			aria-describedby={groupIssues.length ? groupIssueId : undefined}
			className={cn('border-base-300 min-w-0', root ? 'border-0' : 'bg-base-100 rounded-md border border-s-2')}
		>
			<legend className='sr-only'>{messages.conditionCount(countQueryRules(group))}</legend>
			<div className={cn('flex min-h-10 min-w-0 flex-wrap items-center gap-2 px-2 py-1.5', !root && 'bg-base-200/30')}>
				<button
					type='button'
					className='btn btn-ghost btn-xs btn-square'
					title={collapsed ? messages.expandGroup : messages.collapseGroup}
					aria-label={collapsed ? messages.expandGroup : messages.collapseGroup}
					aria-expanded={!collapsed}
					onClick={() => context.toggleCollapsed(group.id)}
				>
					{collapsed ? (
						<ChevronRight aria-hidden='true' className='size-4' />
					) : (
						<ChevronDown aria-hidden='true' className='size-4' />
					)}
				</button>
				<span className='text-base-content/65 text-xs font-medium'>{messages.match}</span>
				{context.readOnly ? (
					<span className='badge badge-outline badge-sm'>
						{group.combinator === 'and' ? messages.all : messages.any}
					</span>
				) : (
					<div role='radiogroup' aria-label={messages.match} className='join'>
						{(['and', 'or'] as const).map((combinator) => (
							<label
								key={combinator}
								className={cn('btn btn-xs join-item min-w-11', group.combinator === combinator && 'btn-active')}
							>
								<input
									type='radio'
									className='sr-only'
									name={`query-combinator-${context.instanceId}-${group.id}`}
									value={combinator}
									checked={group.combinator === combinator}
									disabled={locked}
									onChange={() => context.dispatch({ type: 'update-group', id: group.id, patch: { combinator } })}
								/>
								{combinator === 'and' ? messages.all : messages.any}
							</label>
						))}
					</div>
				)}
				{context.readOnly ? (
					group.negated ? (
						<span className='badge badge-outline badge-sm'>{messages.not}</span>
					) : null
				) : (
					<label className='label text-base-content cursor-pointer gap-1.5 py-0 text-xs'>
						<input
							type='checkbox'
							className='toggle toggle-xs'
							checked={group.negated}
							disabled={locked}
							onChange={(event) =>
								context.dispatch({ type: 'update-group', id: group.id, patch: { negated: event.target.checked } })
							}
						/>
						{messages.not}
					</label>
				)}
				<span className='text-base-content/65 text-[11px]'>{messages.conditionCount(countQueryRules(group))}</span>
				{groupIssues.length ? (
					<span
						className='badge badge-warning badge-xs'
						title={groupIssues[0].message}
						aria-label={groupIssues[0].message}
					>
						{groupIssues.length}
					</span>
				) : null}
				<div className='min-w-2 flex-1' />
				{!root && parentId && !context.readOnly ? (
					<NodeActions node={group} parentId={parentId} context={context} index={index} siblingCount={siblingCount} />
				) : null}
			</div>
			{context.showValidation && groupIssues.length ? (
				<div
					id={groupIssueId}
					className='border-warning/40 bg-warning/15 text-base-content mx-2 mb-1 rounded-sm border px-2 py-1 text-xs'
					role='alert'
				>
					{groupIssues[0].message}
				</div>
			) : null}
			{!collapsed ? (
				<div className={cn('min-w-0 space-y-2', root ? 'pt-1' : 'p-2')}>
					{group.children.length === 0 ? (
						<div className='border-base-300 text-base-content/65 rounded-sm border border-dashed px-3 py-8 text-center text-sm'>
							{messages.emptyGroup}
						</div>
					) : (
						group.children.map((child, childIndex) =>
							child.type === 'group' ? (
								<QueryBuilderGroup
									key={child.id}
									group={child}
									context={context}
									depth={depth + 1}
									index={childIndex}
									siblingCount={group.children.length}
									parentId={group.id}
								/>
							) : (
								<QueryBuilderRule
									key={child.id}
									rule={child}
									parentId={group.id}
									context={context}
									index={childIndex}
									siblingCount={group.children.length}
								/>
							),
						)
					)}
					{!context.readOnly ? (
						<div className='flex flex-wrap items-center gap-2 pt-1'>
							<QueryFieldPicker
								fields={context.fields}
								label={
									<>
										<Plus aria-hidden='true' className='size-3.5' /> {messages.addCondition}
									</>
								}
								searchLabel={messages.searchFields}
								emptyLabel={messages.noFields}
								disabled={context.disabled}
								onSelect={(field) =>
									context.dispatch({
										type: 'insert-node',
										parentId: group.id,
										node: createQueryRuleForField(field, context.createId('rule'), context.operators),
									})
								}
							/>
							<button
								type='button'
								className='btn btn-ghost btn-sm'
								disabled={context.disabled || depth >= context.maxDepth}
								onClick={() =>
									context.dispatch({
										type: 'insert-node',
										parentId: group.id,
										node: createQueryGroup(context.createId('group')),
									})
								}
							>
								<Layers3 aria-hidden='true' className='size-4' />
								{messages.addGroup}
							</button>
						</div>
					) : null}
				</div>
			) : null}
		</fieldset>
	);
}

type QueryBuilderRuleProps = {
	rule: QueryRule;
	parentId: string;
	context: BuilderContext;
	index: number;
	siblingCount: number;
};

function QueryBuilderRule({ rule, parentId, context, index, siblingCount }: QueryBuilderRuleProps) {
	const field = context.fieldMap.get(rule.field);
	const availableOperators = field ? getOperatorsForField(field, context.operators) : [];
	const operator = context.operatorMap.get(rule.operator);
	const operatorAllowed = Boolean(operator && availableOperators.some((candidate) => candidate.name === operator.name));
	const issues = context.issuesByNode.get(rule.id) ?? [];
	const invalid = issues.length > 0;
	const locked = context.disabled;
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
						disabled={locked}
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
						disabled={locked || !field}
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
					renderEditor({ context, editorId, issueId, field, operator, rule, invalid, locked })
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
	locked,
}: {
	context: BuilderContext;
	editorId: string;
	issueId: string;
	field: QueryField;
	operator: QueryOperator;
	rule: QueryRule;
	invalid: boolean;
	locked: boolean;
}) {
	const props: QueryValueEditorProps = {
		id: editorId,
		rule,
		field,
		operator,
		value: rule.value,
		disabled: locked,
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

function NodeActions({
	node,
	parentId,
	context,
	index,
	siblingCount,
}: {
	node: QueryNode;
	parentId: string;
	context: BuilderContext;
	index: number;
	siblingCount: number;
}) {
	const nodeLabel =
		node.type === 'rule'
			? (context.fieldMap.get(node.field)?.label ?? context.messages.queryCondition)
			: messagesForGroup(context.messages, countQueryRules(node));
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

function messagesForGroup(messages: QueryBuilderMessages, count: number) {
	return messages.groupLabel(count);
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
